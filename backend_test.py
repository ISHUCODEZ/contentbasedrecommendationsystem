import requests
import sys
import time
from datetime import datetime

class MovieRecommendationTester:
    def __init__(self, base_url="https://movielens-neural-net.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(response_data) > 0:
                        print(f"   Response keys: {list(response_data.keys())}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                self.failed_tests.append({
                    'name': name,
                    'endpoint': endpoint,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'error': response.text[:200]
                })
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout after {timeout}s")
            self.failed_tests.append({
                'name': name,
                'endpoint': endpoint,
                'error': f'Timeout after {timeout}s'
            })
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'endpoint': endpoint,
                'error': str(e)
            })
            return False, {}

    def test_models_status(self):
        """Test GET /api/models/status - all 7 models should be active"""
        success, response = self.run_test(
            "Models Status",
            "GET",
            "models/status",
            200
        )
        if success:
            expected_models = ['tfidf', 'genre', 'combined', 'word2vec', 'bert', 'collaborative', 'hybrid']
            for model in expected_models:
                if model in response:
                    status = response[model]
                    print(f"   {model}: {'✅ Active' if status else '❌ Inactive'}")
                else:
                    print(f"   {model}: ❌ Missing")
        return success

    def test_recommendations(self, movie_id=1):
        """Test all recommendation algorithms"""
        algorithms = ['tfidf', 'word2vec', 'bert', 'collaborative', 'hybrid']
        results = {}
        
        for algo in algorithms:
            success, response = self.run_test(
                f"{algo.upper()} Recommendations",
                "GET",
                f"recommendations/{movie_id}?algorithm={algo}&top_n=5",
                200
            )
            results[algo] = success
            if success and 'recommendations' in response:
                print(f"   Got {len(response['recommendations'])} recommendations")
        
        return results

    def test_evaluation_metrics(self):
        """Test GET /api/evaluation?k=10&n_users=10 - evaluation metrics for all models"""
        print(f"\n🔍 Testing Evaluation Metrics (this may take 20-60 seconds)...")
        success, response = self.run_test(
            "Evaluation Metrics",
            "GET",
            "evaluation?k=10&n_users=10",
            200,
            timeout=90  # Extended timeout for evaluation
        )
        if success:
            if 'results' in response:
                print(f"   Evaluation completed for {response.get('n_users', 0)} users")
                print(f"   K values tested: {response.get('k_values', [])}")
                print(f"   Elapsed time: {response.get('elapsed_seconds', 0)}s")
            else:
                print("   Warning: No results in evaluation response")
        return success

    def test_similarity(self, movie_id_1=1, movie_id_2=2):
        """Test GET /api/similarity/1/2 - should include word2vec_similarity and bert_similarity fields"""
        success, response = self.run_test(
            "Movie Similarity",
            "GET",
            f"similarity/{movie_id_1}/{movie_id_2}",
            200
        )
        if success:
            required_fields = ['word2vec_similarity', 'bert_similarity']
            for field in required_fields:
                if field in response:
                    print(f"   {field}: {response[field]:.4f}")
                else:
                    print(f"   ❌ Missing field: {field}")
        return success

    def test_search(self):
        """Test POST /api/search with query='Toy Story' returns results"""
        success, response = self.run_test(
            "Movie Search",
            "POST",
            "search",
            200,
            data={"query": "Toy Story", "limit": 10}
        )
        if success and 'results' in response:
            print(f"   Found {len(response['results'])} movies")
            if response['results']:
                print(f"   First result: {response['results'][0].get('title', 'N/A')}")
        return success

    def test_genres(self):
        """Test GET /api/genres returns genre list"""
        success, response = self.run_test(
            "Genres List",
            "GET",
            "genres",
            200
        )
        if success and 'genres' in response:
            print(f"   Found {len(response['genres'])} genres")
            print(f"   Sample genres: {response['genres'][:5]}")
        return success

    def test_movies_endpoint(self):
        """Test basic movies endpoint"""
        success, response = self.run_test(
            "Movies List",
            "GET",
            "movies?limit=10",
            200
        )
        if success and 'movies' in response:
            print(f"   Found {len(response['movies'])} movies")
        return success

    def test_movie_details(self, movie_id=1):
        """Test individual movie details"""
        success, response = self.run_test(
            "Movie Details",
            "GET",
            f"movies/{movie_id}",
            200
        )
        if success:
            print(f"   Movie: {response.get('title', 'N/A')}")
            print(f"   Genres: {response.get('genres', 'N/A')}")
            print(f"   Rating: {response.get('average_rating', 0):.2f}")
        return success

def main():
    print("🎬 MovieLens Recommendation System API Testing")
    print("=" * 60)
    
    tester = MovieRecommendationTester()
    
    # Test basic endpoints first
    print("\n📋 BASIC ENDPOINTS")
    tester.test_movies_endpoint()
    tester.test_movie_details()
    tester.test_genres()
    tester.test_search()
    
    # Test models status
    print("\n🤖 MODEL STATUS")
    tester.test_models_status()
    
    # Test recommendations for all algorithms
    print("\n🎯 RECOMMENDATION ALGORITHMS")
    rec_results = tester.test_recommendations()
    
    # Test similarity
    print("\n🔗 SIMILARITY TESTING")
    tester.test_similarity()
    
    # Test evaluation (this takes longer)
    print("\n📊 EVALUATION METRICS")
    tester.test_evaluation_metrics()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"Success rate: {success_rate:.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ FAILED TESTS ({len(tester.failed_tests)}):")
        for test in tester.failed_tests:
            print(f"  - {test['name']}: {test.get('error', 'Unknown error')}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
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
        self.access_token = None
        self.session = requests.Session()

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30, auth_required=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add auth header if required and token available
        if auth_required and self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers, timeout=timeout)

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

    # ═══════════════════════ AUTH TESTS ═══════════════════════
    
    def test_auth_register(self):
        """Test POST /api/auth/register - register new user"""
        test_email = f"test_{int(time.time())}@example.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"email": test_email, "password": "testpass123", "name": "Test User"}
        )
        if success and 'token' in response:
            self.access_token = response['token']
            print(f"   Registered user: {response.get('email')}")
            print(f"   User ID: {response.get('id')}")
        return success

    def test_auth_login_admin(self):
        """Test POST /api/auth/login - login with admin credentials"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@example.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.access_token = response['token']
            print(f"   Logged in as: {response.get('email')}")
            print(f"   Role: {response.get('role')}")
        return success

    def test_auth_me(self):
        """Test GET /api/auth/me - get current user with Bearer token"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            auth_required=True
        )
        if success:
            print(f"   Current user: {response.get('email')}")
            print(f"   Name: {response.get('name')}")
        return success

    def test_auth_logout(self):
        """Test POST /api/auth/logout - logout"""
        success, response = self.run_test(
            "User Logout",
            "POST",
            "auth/logout",
            200,
            auth_required=True
        )
        if success:
            print(f"   Logout message: {response.get('message')}")
        return success

    # ═══════════════════════ PROFILE TESTS ═══════════════════════

    def test_profile_rate_movie(self):
        """Test POST /api/profile/rate - rate a movie (authenticated)"""
        success, response = self.run_test(
            "Rate Movie",
            "POST",
            "profile/rate",
            200,
            data={"movie_id": 1, "rating": 4.5},
            auth_required=True
        )
        if success:
            print(f"   Rated movie {response.get('movie_id')} with {response.get('rating')} stars")
        return success

    def test_profile_get_ratings(self):
        """Test GET /api/profile/ratings - get user ratings"""
        success, response = self.run_test(
            "Get User Ratings",
            "GET",
            "profile/ratings",
            200,
            auth_required=True
        )
        if success:
            print(f"   User has {response.get('count', 0)} ratings")
        return success

    def test_profile_watchlist_toggle(self):
        """Test POST /api/profile/watchlist - toggle movie in watchlist"""
        success, response = self.run_test(
            "Toggle Watchlist",
            "POST",
            "profile/watchlist",
            200,
            data={"movie_id": 2},
            auth_required=True
        )
        if success:
            status = "added to" if response.get('in_watchlist') else "removed from"
            print(f"   Movie {response.get('movie_id')} {status} watchlist")
        return success

    def test_profile_get_watchlist(self):
        """Test GET /api/profile/watchlist - get watchlist"""
        success, response = self.run_test(
            "Get Watchlist",
            "GET",
            "profile/watchlist",
            200,
            auth_required=True
        )
        if success:
            print(f"   Watchlist has {response.get('count', 0)} movies")
        return success

    def test_profile_recommendation_history(self):
        """Test GET /api/profile/recommendation-history - get history"""
        success, response = self.run_test(
            "Get Recommendation History",
            "GET",
            "profile/recommendation-history",
            200,
            auth_required=True
        )
        if success:
            print(f"   History has {response.get('count', 0)} entries")
        return success

    # ═══════════════════════ DATASET TESTS ═══════════════════════

    def test_dataset_stats(self):
        """Test GET /api/dataset/stats - should show 17k+ total, 9742 MovieLens, 7787 Netflix"""
        success, response = self.run_test(
            "Dataset Statistics",
            "GET",
            "dataset/stats",
            200
        )
        if success:
            total = response.get('total_movies', 0)
            ml_count = response.get('movielens_count', 0)
            nf_count = response.get('netflix_count', 0)
            ratings = response.get('total_ratings', 0)
            
            print(f"   Total movies: {total:,}")
            print(f"   MovieLens: {ml_count:,}")
            print(f"   Netflix: {nf_count:,}")
            print(f"   Total ratings: {ratings:,}")
            
            # Validate expected counts
            if total >= 17000:
                print("   ✅ Total movies >= 17k")
            else:
                print(f"   ❌ Total movies {total} < 17k expected")
                
            if ml_count >= 9000:
                print("   ✅ MovieLens count looks good")
            else:
                print(f"   ❌ MovieLens count {ml_count} seems low")
                
            if nf_count >= 7000:
                print("   ✅ Netflix count looks good")
            else:
                print(f"   ❌ Netflix count {nf_count} seems low")
        
        return success

    def test_movies_netflix_filter(self):
        """Test GET /api/movies?source=netflix - filter movies by Netflix source"""
        success, response = self.run_test(
            "Netflix Movies Filter",
            "GET",
            "movies?source=netflix&limit=10",
            200
        )
        if success and 'movies' in response:
            movies = response['movies']
            print(f"   Found {len(movies)} Netflix movies")
            if movies:
                # Check if all movies have Netflix source
                netflix_movies = [m for m in movies if m.get('source') == 'netflix']
                print(f"   Netflix source movies: {len(netflix_movies)}/{len(movies)}")
        return success

    def test_movie_netflix_details(self):
        """Test GET /api/movies/1 - should include director, cast, description, source fields"""
        # First get a Netflix movie ID
        success, response = self.run_test(
            "Get Netflix Movie for Details",
            "GET",
            "movies?source=netflix&limit=1",
            200
        )
        
        if success and response.get('movies'):
            netflix_movie_id = response['movies'][0]['movieId']
            
            success, movie_response = self.run_test(
                "Netflix Movie Details",
                "GET",
                f"movies/{netflix_movie_id}",
                200
            )
            
            if success:
                required_fields = ['director', 'cast', 'description', 'source']
                print(f"   Movie: {movie_response.get('title', 'N/A')}")
                print(f"   Source: {movie_response.get('source', 'N/A')}")
                
                for field in required_fields:
                    value = movie_response.get(field, '')
                    if value:
                        print(f"   ✅ {field}: {str(value)[:50]}...")
                    else:
                        print(f"   ❌ Missing {field}")
            
            return success
        else:
            print("   ❌ Could not find Netflix movie for testing")
            return False

    def test_models_status(self):
        """Test GET /api/models/status - all 10 models should be active"""
        success, response = self.run_test(
            "Models Status",
            "GET",
            "models/status",
            200
        )
        if success:
            expected_models = ['tfidf', 'genre', 'combined', 'word2vec', 'bert', 'collaborative', 'hybrid', 'svd', 'kg', 'sentiment']
            active_count = 0
            for model in expected_models:
                if model in response:
                    status = response[model]
                    if status:
                        active_count += 1
                    print(f"   {model}: {'✅ Active' if status else '❌ Inactive'}")
                else:
                    print(f"   {model}: ❌ Missing")
            print(f"   Total active models: {active_count}/10")
        return success

    def test_recommendations(self, movie_id=1):
        """Test all recommendation algorithms including advanced ones"""
        algorithms = ['tfidf', 'word2vec', 'bert', 'collaborative', 'hybrid', 'svd', 'kg', 'sentiment']
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

    # ═══════════════════════ ADVANCED FEATURES TESTS ═══════════════════════

    def test_explainable_recommendations(self):
        """Test GET /api/explain/1/2 - explainable recommendation reasons"""
        success, response = self.run_test(
            "Explainable Recommendations",
            "GET",
            "explain/1/2",
            200
        )
        if success:
            print(f"   Source movie: {response.get('source_movie', 'N/A')}")
            print(f"   Recommended movie: {response.get('recommended_movie', 'N/A')}")
            reasons = response.get('reasons', [])
            print(f"   Explanation reasons: {len(reasons)}")
            if reasons:
                print(f"   Sample reason: {reasons[0]}")
        return success

    def test_recommendations_with_explanations(self):
        """Test GET /api/recommendations/1/explained?algorithm=tfidf&top_n=5"""
        success, response = self.run_test(
            "Recommendations with Explanations",
            "GET",
            "recommendations/1/explained?algorithm=tfidf&top_n=5",
            200
        )
        if success and 'recommendations' in response:
            recs = response['recommendations']
            print(f"   Got {len(recs)} recommendations with explanations")
            if recs and 'explanation' in recs[0]:
                print(f"   First rec explanation: {recs[0]['explanation'][:2] if recs[0]['explanation'] else 'None'}")
        return success

    def test_coldstart_genres(self):
        """Test GET /api/coldstart/genres - cold start quiz genre data"""
        success, response = self.run_test(
            "Cold Start Genres",
            "GET",
            "coldstart/genres",
            200
        )
        if success and 'genres' in response:
            genres = response['genres']
            print(f"   Found {len(genres)} genres for cold start")
            if genres:
                print(f"   Sample genre: {genres[0].get('genre', 'N/A')}")
                print(f"   Sample movies: {len(genres[0].get('sample_movies', []))}")
        return success

    def test_coldstart_recommend(self):
        """Test POST /api/coldstart/recommend with genres=['Action','Comedy']"""
        success, response = self.run_test(
            "Cold Start Recommendations",
            "POST",
            "coldstart/recommend",
            200,
            data={"genres": ["Action", "Comedy"], "top_n": 10}
        )
        if success and 'recommendations' in response:
            recs = response['recommendations']
            print(f"   Got {len(recs)} cold start recommendations")
            print(f"   Selected genres: {response.get('selected_genres', [])}")
        return success

    def test_ab_test(self):
        """Test GET /api/ab-test/1?algo_a=tfidf&algo_b=collaborative"""
        success, response = self.run_test(
            "A/B Test Comparison",
            "GET",
            "ab-test/1?algo_a=tfidf&algo_b=collaborative&top_n=10",
            200
        )
        if success:
            print(f"   Movie ID: {response.get('movie_id', 'N/A')}")
            print(f"   Algorithm A: {response.get('algorithm_a', {}).get('name', 'N/A')}")
            print(f"   Algorithm B: {response.get('algorithm_b', {}).get('name', 'N/A')}")
            print(f"   Overlap count: {response.get('overlap_count', 0)}")
            print(f"   Jaccard similarity: {response.get('jaccard_similarity', 0):.3f}")
        return success

    def test_user_clusters(self):
        """Test GET /api/user-clusters - user clustering results"""
        success, response = self.run_test(
            "User Clustering",
            "GET",
            "user-clusters",
            200
        )
        if success:
            print(f"   Number of clusters: {response.get('n_clusters', 0)}")
            print(f"   Total users: {response.get('total_users', 0)}")
            cluster_stats = response.get('cluster_stats', {})
            print(f"   Cluster stats available: {len(cluster_stats)} clusters")
        return success

    def test_diversity_score(self):
        """Test GET /api/diversity/1?algorithm=tfidf - diversity score"""
        success, response = self.run_test(
            "Diversity Score",
            "GET",
            "diversity/1?algorithm=tfidf&top_n=10",
            200
        )
        if success:
            print(f"   Movie ID: {response.get('movie_id', 'N/A')}")
            print(f"   Algorithm: {response.get('algorithm', 'N/A')}")
            print(f"   Diversity score: {response.get('diversity', 0):.4f}")
            print(f"   Recommendation count: {response.get('recommendation_count', 0)}")
        return success

    def test_similarity_graph(self):
        """Test GET /api/similarity-graph/1?top_n=10 - graph data with nodes and links"""
        success, response = self.run_test(
            "Similarity Graph Data",
            "GET",
            "similarity-graph/1?top_n=10",
            200
        )
        if success:
            nodes = response.get('nodes', [])
            links = response.get('links', [])
            print(f"   Graph nodes: {len(nodes)}")
            print(f"   Graph links: {len(links)}")
            if nodes:
                source_node = next((n for n in nodes if n.get('group') == 'source'), None)
                if source_node:
                    print(f"   Source movie: {source_node.get('title', 'N/A')}")
        return success

def main():
    print("🎬 MovieLens Recommendation System API Testing")
    print("=" * 60)
    
    tester = MovieRecommendationTester()
    
    # Test dataset stats first
    print("\n📊 DATASET STATISTICS")
    tester.test_dataset_stats()
    
    # Test auth endpoints
    print("\n🔐 AUTHENTICATION TESTS")
    tester.test_auth_register()
    tester.test_auth_me()
    
    # Test profile endpoints (requires auth)
    print("\n👤 PROFILE TESTS")
    tester.test_profile_rate_movie()
    tester.test_profile_get_ratings()
    tester.test_profile_watchlist_toggle()
    tester.test_profile_get_watchlist()
    tester.test_profile_recommendation_history()
    
    # Test logout
    tester.test_auth_logout()
    
    # Login as admin for remaining tests
    print("\n🔐 ADMIN LOGIN")
    tester.test_auth_login_admin()
    
    # Test basic endpoints
    print("\n📋 BASIC ENDPOINTS")
    tester.test_movies_endpoint()
    tester.test_movie_details()
    tester.test_movies_netflix_filter()
    tester.test_movie_netflix_details()
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
    
    # Test advanced features
    print("\n🚀 ADVANCED FEATURES")
    tester.test_explainable_recommendations()
    tester.test_recommendations_with_explanations()
    tester.test_coldstart_genres()
    tester.test_coldstart_recommend()
    tester.test_ab_test()
    tester.test_user_clusters()
    tester.test_diversity_score()
    tester.test_similarity_graph()
    
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
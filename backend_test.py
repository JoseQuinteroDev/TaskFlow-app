import requests
import sys
import json
from datetime import datetime, timezone, timedelta

class TaskFlowAPITester:
    def __init__(self, base_url="https://task-organizer-307.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.task_id = None
        self.category_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, cookies=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = self.session.patch(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_register(self):
        """Test user registration"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@taskflow.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "Test123!",
                "name": "Test User"
            }
        )
        if success and 'id' in response:
            self.user_id = response['id']
            print(f"   Registered user ID: {self.user_id}")
            return True
        return False

    def test_auth_login(self):
        """Test user login with test credentials"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": "test@taskflow.com",
                "password": "Test123!"
            }
        )
        if success and 'id' in response:
            self.user_id = response['id']
            print(f"   Logged in user ID: {self.user_id}")
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_auth_logout(self):
        """Test user logout"""
        success, response = self.run_test(
            "User Logout",
            "POST",
            "auth/logout",
            200
        )
        return success

    def test_create_category(self):
        """Test category creation"""
        success, response = self.run_test(
            "Create Category",
            "POST",
            "categories",
            200,
            data={
                "name": "Test Category",
                "color": "#FF5733"
            }
        )
        if success and 'id' in response:
            self.category_id = response['id']
            print(f"   Created category ID: {self.category_id}")
            return True
        return False

    def test_get_categories(self):
        """Test get all categories"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )
        return success

    def test_create_task(self):
        """Test task creation"""
        due_date = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        reminder_date = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        
        success, response = self.run_test(
            "Create Task",
            "POST",
            "tasks",
            200,
            data={
                "title": "Test Task",
                "description": "This is a test task",
                "status": "todo",
                "priority": "high",
                "due_date": due_date,
                "category": self.category_id,
                "tags": ["test", "api"],
                "reminder": reminder_date
            }
        )
        if success and 'id' in response:
            self.task_id = response['id']
            print(f"   Created task ID: {self.task_id}")
            return True
        return False

    def test_get_tasks(self):
        """Test get all tasks"""
        success, response = self.run_test(
            "Get All Tasks",
            "GET",
            "tasks",
            200
        )
        return success

    def test_get_tasks_with_filters(self):
        """Test get tasks with filters"""
        success, response = self.run_test(
            "Get Tasks with Filters",
            "GET",
            "tasks?status=todo&priority=high&search=Test",
            200
        )
        return success

    def test_get_task_by_id(self):
        """Test get task by ID"""
        if not self.task_id:
            print("❌ No task ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Task by ID",
            "GET",
            f"tasks/{self.task_id}",
            200
        )
        return success

    def test_update_task(self):
        """Test task update"""
        if not self.task_id:
            print("❌ No task ID available for testing")
            return False
            
        success, response = self.run_test(
            "Update Task",
            "PUT",
            f"tasks/{self.task_id}",
            200,
            data={
                "title": "Updated Test Task",
                "description": "This task has been updated",
                "status": "in_progress",
                "priority": "medium"
            }
        )
        return success

    def test_update_task_status(self):
        """Test task status update"""
        if not self.task_id:
            print("❌ No task ID available for testing")
            return False
            
        success, response = self.run_test(
            "Update Task Status",
            "PATCH",
            f"tasks/{self.task_id}/status",
            200,
            data={"status": "done"}
        )
        return success

    def test_get_stats(self):
        """Test get statistics"""
        success, response = self.run_test(
            "Get Statistics",
            "GET",
            "stats",
            200
        )
        return success

    def test_delete_task(self):
        """Test task deletion"""
        if not self.task_id:
            print("❌ No task ID available for testing")
            return False
            
        success, response = self.run_test(
            "Delete Task",
            "DELETE",
            f"tasks/{self.task_id}",
            200
        )
        return success

    def test_delete_category(self):
        """Test category deletion"""
        if not self.category_id:
            print("❌ No category ID available for testing")
            return False
            
        success, response = self.run_test(
            "Delete Category",
            "DELETE",
            f"categories/{self.category_id}",
            200
        )
        return success

def main():
    print("🚀 Starting TaskFlow API Tests")
    print("=" * 50)
    
    tester = TaskFlowAPITester()
    
    # Test sequence
    tests = [
        # Authentication tests
        ("Login with test credentials", tester.test_auth_login),
        ("Get current user", tester.test_auth_me),
        
        # Category tests
        ("Create category", tester.test_create_category),
        ("Get categories", tester.test_get_categories),
        
        # Task tests
        ("Create task", tester.test_create_task),
        ("Get all tasks", tester.test_get_tasks),
        ("Get tasks with filters", tester.test_get_tasks_with_filters),
        ("Get task by ID", tester.test_get_task_by_id),
        ("Update task", tester.test_update_task),
        ("Update task status", tester.test_update_task_status),
        
        # Stats test
        ("Get statistics", tester.test_get_stats),
        
        # Cleanup tests
        ("Delete task", tester.test_delete_task),
        ("Delete category", tester.test_delete_category),
        
        # Logout test
        ("Logout", tester.test_auth_logout),
    ]
    
    # Run all tests
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test '{test_name}' failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
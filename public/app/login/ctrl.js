adminCtrl.LoginCtrl = function ($rootScope, $scope, $http) {

	$scope.user = {};
	$scope.login = function () {
		if ($scope.user.email !== "" && $scope.user.password !== "") {
			$http.post("http://pickyourday.herokuapp.com/api/oauth", $scope.user).then(function successCallback(response) {
				
			}, function errorCallback(response) {

			});
		}

	}
}
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const String baseUrl = 'https://colorsdigitalocean.xyz/cards/api';
  
  static Future<AuthResult> register({
    required String firstName,
    required String lastName,
    required String username,
    required String email,
    required String password,
  }) async {
    try {
      print('🔵 Attempting registration...');
      print('URL: $baseUrl/register');
      print('Data: firstName=$firstName, lastName=$lastName, username=$username, email=$email');
      
      final response = await http.post(
        Uri.parse('$baseUrl/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'firstName': firstName,
          'lastName': lastName,
          'username': username,
          'email': email,
          'password': password,
        }),
      );

      print('📥 Response Status: ${response.statusCode}');
      print('📥 Response Body: ${response.body}');

      final data = json.decode(response.body);

      if (response.statusCode == 201) {
        print('✅ Registration successful!');
        return AuthResult(
          success: data['success'] ?? true,
          message: data['message'] ?? 'Registration successful',
          userId: data['userId']?.toString(),
        );
      } else {
        print('❌ Registration failed: ${data['message']}');
        return AuthResult(
          success: false,
          message: data['message'] ?? 'Registration failed',
        );
      }
    } catch (e) {
      print('💥 Registration error: $e');
      return AuthResult(
        success: false,
        message: 'Network error: ${e.toString()}',
      );
    }
  }

  static Future<AuthResult> login({
    required String username,
    required String password,
  }) async {
    try {
      print('🔵 Attempting login...');
      print('URL: $baseUrl/login');
      print('Username: $username');
      
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'username': username.trim().toLowerCase(),
          'password': password.trim(),
        }),
      );

      print('📥 Response Status: ${response.statusCode}');
      print('📥 Response Body: ${response.body}');

      final data = json.decode(response.body);

      // Check if response contains error field
      if (data['error'] != null) {
        print('❌ Login failed: ${data['error']}');
        return AuthResult(
          success: false,
          message: data['error'],
        );
      }

      // Get accessToken (not 'token')
      final token = data['accessToken'];
      final userId = data['userId'];
      final firstName = data['firstName'] ?? '';
      final lastName = data['lastName'] ?? '';
      final usernameFromApi = data['username'] ?? username;
      final userName = '$firstName $lastName'.trim();

      if (token != null && userId != null) {
        print('✅ Login successful!');
        
        // Save to SharedPreferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('authToken', token);
        await prefs.setString('userId', userId.toString());
        await prefs.setString('userName', userName.isNotEmpty ? userName : usernameFromApi);
        await prefs.setString('username', usernameFromApi);
        await prefs.setString('firstName', firstName);
        await prefs.setString('lastName', lastName);
        print('💾 User data saved to SharedPreferences');

        return AuthResult(
          success: true,
          message: 'Login successful!',
          token: token,
          userId: userId.toString(),
          userName: userName.isNotEmpty ? userName : usernameFromApi,
        );
      } else {
        print('❌ Invalid response from server');
        return AuthResult(
          success: false,
          message: 'Invalid response from server',
        );
      }
    } catch (e) {
      print('💥 Login error: $e');
      return AuthResult(
        success: false,
        message: 'Network error: ${e.toString()}',
      );
    }
  }

  // These endpoints don't exist in your API yet
  static Future<AuthResult> resendVerificationEmail(String usernameOrEmail) async {
    return AuthResult(
      success: false,
      message: 'This feature is not yet implemented on the server',
    );
  }

  static Future<AuthResult> requestPasswordReset(String email) async {
    return AuthResult(
      success: false,
      message: 'This feature is not yet implemented on the server',
    );
  }

  static Future<AuthResult> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    return AuthResult(
      success: false,
      message: 'This feature is not yet implemented on the server',
    );
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('authToken');
    await prefs.remove('userId');
    await prefs.remove('userName');
    await prefs.remove('username');
    await prefs.remove('firstName');
    await prefs.remove('lastName');
    print('🚪 User logged out');
  }

  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('authToken');
    return token != null && token.isNotEmpty;
  }

  static Future<Map<String, String?>> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'token': prefs.getString('authToken'),
      'userId': prefs.getString('userId'),
      'userName': prefs.getString('userName'),
      'username': prefs.getString('username'),
      'firstName': prefs.getString('firstName'),
      'lastName': prefs.getString('lastName'),
    };
  }
}

class AuthResult {
  final bool success;
  final String message;
  final String? token;
  final String? userId;
  final String? userName;
  final bool requiresVerification;

  AuthResult({
    required this.success,
    required this.message,
    this.token,
    this.userId,
    this.userName,
    this.requiresVerification = false,
  });
}
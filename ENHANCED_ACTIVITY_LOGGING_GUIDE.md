# Enhanced Activity Logging System

## Overview
The enhanced activity logging system captures **every user action** in detail, providing comprehensive tracking for the login activity dashboard. This system goes beyond basic login/logout tracking to record all user interactions with detailed context.

## Key Features

### 1. **Comprehensive Action Tracking**
- **Authentication**: Login attempts (successful/failed), logout, registration, password resets
- **Data Operations**: Create, Read, Update, Delete operations on all entities
- **File Operations**: Upload, download, export, import of documents
- **Communication**: Messages sent, notifications created, evaluations submitted
- **Navigation**: Page views, searches, filters applied
- **System Actions**: Account management, user assignments, approvals/rejections

### 2. **Detailed Context Capture**
- **User Information**: ID, name, email, role
- **Session Details**: Session ID, device info, browser, OS
- **Network Information**: IP address, location (basic)
- **Request Details**: HTTP method, path, query parameters, request body
- **Response Information**: Status code, response time, success/failure
- **Action Metadata**: Entity type, entity ID, specific action details

### 3. **Enhanced Data Model**
```javascript
ActivityLog Schema:
- userId: ObjectId (ref to User)
- role: String (admin, student, universityAdviser, companyAdviser, facultyHead, guest)
- action: String (detailed human-readable description)
- method: String (HTTP method)
- path: String (API endpoint)
- entityType: String (User, Student, Program, Application, etc.)
- entityId: String (specific entity identifier)
- success: Boolean
- statusCode: Number
- ipAddress: String
- userAgent: String
- actionDetails: Mixed (additional context data)
- requestBody: String (JSON stringified request data)
- queryParams: String (JSON stringified query parameters)
- responseTime: Number (milliseconds)
- sessionId: String (unique session identifier)
- deviceInfo: String (browser and OS information)
- location: String (approximate location from IP)
- timestamps: createdAt, updatedAt
```

## Implementation Details

### 1. **Activity Logger Middleware**
Located in `backend/middleware/activityLogger.js`

**Features:**
- Automatically captures all API requests
- Generates detailed action descriptions based on endpoint patterns
- Extracts comprehensive context from requests
- Non-blocking logging (doesn't affect response times)
- Handles errors gracefully

**Example Action Descriptions:**
- `"User login attempt successful"` (instead of `"POST /api/auth/login"`)
- `"Created new program: IT Maintenance & Support"` (instead of `"POST /api/programs"`)
- `"Viewed student details for advising (Student ID: 64f7b1c2e4b0a1b2c3d4e5f6)"` (instead of `"GET /api/advisers/student-details/64f7b1c2e4b0a1b2c3d4e5f6"`)
- `"Exported final evaluation PDF"` (instead of `"GET /api/advisers/final-evaluation/export-pdf"`)

### 2. **Activity Tracker Utility**
Located in `backend/utils/activityTracker.js`

**Helper Functions:**
- `trackLogin()` - Enhanced login tracking with failure reasons
- `trackLogout()` - Session end tracking
- `trackDataAccess()` - CRUD operation tracking
- `trackFileOperation()` - File upload/download tracking
- `trackEvaluationActivity()` - Evaluation-specific tracking
- `trackCommunication()` - Message/notification tracking

**Device & Session Tracking:**
- Generates unique session IDs
- Extracts browser, OS, and device type from user agent
- Basic IP-based location detection
- Session duration calculation

### 3. **Enhanced Controllers**
Updated controllers now include detailed activity tracking:

**Authentication Controller (`authController.js`):**
- Tracks successful/failed login attempts with reasons
- Records user registration activities
- Logs profile updates with changed fields
- Captures logout activities with session info

**Example Integration:**
```javascript
// Enhanced login tracking
await trackLogin(req, { 
  success: true, 
  role: user.role, 
  email: user.email 
});

// Failed login with reason
await trackLogin(req, { 
  success: false, 
  reason: "Invalid password", 
  email: user.email 
});
```

### 4. **API Endpoints for Activity Data**

**Admin Endpoints:**
- `GET /api/login-activities/analytics` - Activity analytics and statistics
- `GET /api/login-activities/detailed` - Detailed activity logs with filtering
- `GET /api/login-activities/timeline` - Unified timeline of all activities
- `GET /api/login-activities/user/:userId/summary` - User-specific activity summary

**User Endpoints:**
- `GET /api/login-activities/my-detailed` - User's own detailed activities
- `GET /api/login-activities/my-summary` - User's activity summary
- `DELETE /api/login-activities/my-activities` - Clear user's own activities

**Query Parameters:**
- `userId`, `role`, `entityType`, `success`, `method` - Filtering
- `start`, `end` - Date range filtering
- `search` - Text search across actions, messages, paths
- `page`, `limit` - Pagination
- `days` - Time period for analytics (default: 30)

## Activity Types Tracked

### **Authentication Activities**
- User login attempts (successful/failed with reasons)
- User logout with session duration
- User registration
- Password reset requests
- Account lockouts

### **Data Management Activities**
- **Programs**: Create, view, update, delete programs
- **Applications**: Submit, view, approve, reject applications
- **Students**: View profiles, update information, assign to groups
- **Evaluations**: Create, update, export final evaluations
- **Groups**: Create groups, assign students, manage assignments

### **File Operations**
- Upload acceptance papers
- Download documents
- Export PDF reports
- Import data files

### **Communication Activities**
- Send messages between advisers and students
- Create notifications
- Read messages and notifications
- Send evaluation updates

### **Administrative Activities**
- Create temporary accounts (University Adviser, Company Adviser, Faculty Head)
- Assign students to advisers
- Manage user permissions
- View system analytics

### **Navigation & Search Activities**
- Page navigation
- Search operations
- Filter applications
- Sort data views

## Analytics & Reporting

### **Activity Analytics**
- Activity type distribution with success rates
- Entity interaction statistics
- Hourly activity patterns
- Daily activity trends
- Most active users ranking

### **User Activity Summary**
- Total activities count
- Success rate percentage
- Average response time
- Unique entity types accessed
- Recent activity timeline
- Activity breakdown by type

### **System Insights**
- Peak usage hours
- Most accessed features
- Error rate analysis
- User engagement patterns
- Security incident detection

## Security & Privacy

### **Data Protection**
- Sensitive data (passwords) never logged
- Request bodies sanitized for security
- IP addresses logged for security monitoring
- Session tracking for anomaly detection

### **Access Control**
- Admin-only access to system-wide analytics
- Users can only view their own detailed activities
- Role-based filtering and access restrictions
- Audit trail for administrative actions

## Usage Examples

### **Viewing User Activity Timeline**
```javascript
// Get detailed activities for a specific user
GET /api/login-activities/detailed?userId=64f7b1c2e4b0a1b2c3d4e5f6&days=7

Response:
{
  "success": true,
  "data": {
    "activities": [
      {
        "action": "Created final evaluation",
        "entityType": "Final Evaluation",
        "success": true,
        "responseTime": 245,
        "actionDetails": {
          "studentId": "64f7b1c2e4b0a1b2c3d4e5f7",
          "totalScore": 85
        },
        "deviceInfo": "Chrome on Windows (Desktop)",
        "createdAt": "2024-09-01T20:45:30.000Z"
      }
    ]
  }
}
```

### **Activity Analytics Dashboard**
```javascript
// Get system-wide activity analytics
GET /api/login-activities/analytics?days=30

Response:
{
  "success": true,
  "data": {
    "activityStats": [
      { "_id": "Authentication", "count": 1250, "successRate": 0.94 },
      { "_id": "Final Evaluation", "count": 340, "successRate": 0.98 },
      { "_id": "Application", "count": 890, "successRate": 0.96 }
    ],
    "hourlyStats": [...],
    "dailyStats": [...],
    "topUsers": [...]
  }
}
```

## Benefits

### **For Administrators**
- Complete visibility into system usage
- Security monitoring and anomaly detection
- User behavior analytics
- Performance monitoring
- Audit compliance

### **For Users**
- Personal activity history
- Session management
- Security awareness
- Usage patterns insight

### **For System Monitoring**
- Error tracking and debugging
- Performance optimization
- Feature usage analytics
- Capacity planning

## Integration Notes

The enhanced activity logging system is:
- **Non-intrusive**: Doesn't affect existing functionality
- **Performance-optimized**: Asynchronous logging with minimal overhead
- **Scalable**: Indexed database queries for fast retrieval
- **Extensible**: Easy to add new activity types and contexts
- **Backward-compatible**: Works with existing login activity system

All existing API endpoints continue to work unchanged while now providing comprehensive activity tracking in the background.

# URL Shortener API

A robust and secure URL shortening service built with Java and Spring Boot. This application allows users to shorten
long URLs, customize short codes, track link analytics, and manage their links efficiently.

## ✨ Features

### 🔗 URL Shortening

- **Shorten Long URLs**: Convert lengthy URLs into concise, shareable links.
- **Custom Short Codes**: Allow users to define their own short codes for URLs.
- **Redirect to Original URL**: Seamlessly redirect short URLs to their original destinations.
- **Unique Code Generation**: Automatically generate unique short codes to prevent collisions.

### 🔐 Authentication & Security

- **User Sign Up / Login**: Secure user registration and authentication system.
- **Password Hashing**: Store passwords securely using hashing algorithms.
- **JWT or Session-Based Auth**: Implement JSON Web Tokens or session-based authentication for user sessions.

### 📊 Analytics & Tracking

- **Click Count Tracking**: Monitor the number of times each short URL is accessed.
- **Click Date Tracking**: Record timestamps of each click for detailed analytics.
- **IP Location & Device Info**: Capture IP addresses, device types, countries, regions, and cities of users clicking
  the links.

### 🛠️ Link Management

- **List All Created Links**: Display all URLs created by a user.
- **Delete Links**: Allow users to remove their short URLs.
- **Edit Destination URL**: Enable updating the original URL associated with a short code.
- **Expiration Dates**: Set expiration dates for short URLs to disable them after a certain period.
- **QR Code Generation**: Generate QR codes for each short URL for easy sharing.

## 🛠️ Tech Stack

- **Backend**: Java, Spring Boot
- **Security**: Spring Security, JWT
- **Database**: PostgreSQL
- **Analytics**: IP location tracking using ip-api.com
- **QR Code Generation**: ZXing library

### Prerequisites

- Java 11 or higher
- Maven
- PostgreSQL database

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/GopiSVDev/url_shortener.git
   cd url_shortener
   ```

2. **Configure the application**:

   Update the `application.properties` file with your database credentials and other configurations.

3. **Build and run the application**:

   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

## 📂 Project Structure

- `src/main/java` - Main application source code
- `src/main/resources` - Configuration files and static resources
- `pom.xml` - Maven dependencies and build configuration

## 📄 API Endpoints

- **POST `/shorten`**: Create a new short URL
- **GET `/{shortCode}`**: Redirect to the original URL
- **GET `/users/urls`**: Retrieve all short URLs for the authenticated user
- **PUT `/user/urls/{code}`**: Update the destination URL or expiration date
- **DELETE `/user/urls/{code}`**: Delete a short URL
- **GET `/user/urls/{code}/stats`**: Get analytics data for a short URL

## 🔒 Security

- Passwords are hashed using BCrypt before storage.
- Authentication is managed via JWT tokens or HTTP sessions.
- Role-based access control ensures users can only manage their own URLs.

## 📈 Analytics

Each click on a short URL is logged with the following information:

- Timestamp of the click
- IP address of the user
- Geolocation data (country, region, city)
- Device type

## 📸 QR Code Generation

For each short URL, a QR code is generated using the ZXing library, allowing users to easily share links in physical
formats.
# SYSTEM_ARCHITECTURE.md

## Overview

The Attendance List OCR System is a web application designed to automate the process of digitizing attendance records. Users can upload images or PDF files of attendance sheets, and the system uses Optical Character Recognition (OCR) to extract the data, structure it into a table, and allow for easy export to CSV and Excel formats. The primary goal is to save time and reduce manual data entry errors.

## System Components

-   **Frontend:** A single-page application (SPA) built with React, TypeScript, and Vite. It provides the user interface for file uploads, data preview, and export functionality.
-   **OCR Engine:** The core data extraction engine, powered by the Gemini 2.0 API. It processes the uploaded image or PDF and returns structured data.
-   **API Layer:** The communication layer between the frontend and the OCR engine. It handles API requests to the Gemini 2.0 API.
-   **File Processing Module:** A client-side module responsible for handling file uploads, validating file types, and converting files into a format suitable for the OCR engine.
-   **Data Formatter:** A module that takes the raw JSON output from the OCR engine and transforms it into a structured format suitable for display in a table.
-   **Export Module:** A module that allows users to export the structured data to CSV and Excel formats, using libraries like `xlsx` and `papaparse`.

## Data Flow

1.  **File Upload:** The user selects an image or PDF file of an attendance sheet and uploads it through the frontend.
2.  **File Processing:** The File Processing Module validates the file type and size.
3.  **OCR Processing:** The frontend sends the file to the Gemini 2.0 API for OCR processing.
4.  **Data Extraction:** The Gemini 2.0 API processes the file, extracts the attendance data, and returns it as a structured JSON object.
5.  **Data Transformation:** The Data Formatter module on the frontend receives the JSON data and transforms it into a format that can be easily displayed in a table.
6.  **Data Preview:** The user previews the extracted data in a table on the frontend.
7.  **Data Export:** The user can export the data to CSV or Excel format using the Export Module.

## Technology Stack

-   **Frontend:** React, TypeScript, Vite
-   **OCR Engine:** Gemini 2.0 API
-   **Styling:** Tailwind CSS
-   **File Export:** `xlsx` for Excel, `papaparse` for CSV
-   **Deployment:** Vercel

## Frontend Architecture

-   **Component Structure:** The frontend is built with a component-based architecture. Key components include:
    -   `FileUpload`: Handles file selection and validation.
    -   `DataTable`: Displays the extracted data in a table.
    -   `ExportButtons`: Provides options for exporting data.
-   **State Management:** The application uses React's built-in state management (useState, useReducer) to manage component-level state.
-   **User Interactions:** User interactions, such as file uploads and export clicks, trigger the corresponding modules to process the data.

## Backend / AI Integration

The application integrates with the Gemini 2.0 API for OCR processing. The frontend sends the uploaded file to the API, which then returns a structured JSON object containing the extracted data. The communication is handled via HTTPS requests.

## Security & Performance Considerations

-   **Input Validation:** The application validates file types and sizes to prevent malicious uploads.
-   **File Size Limits:** The application imposes a file size limit to prevent performance issues.
-   **Async Processing:** The OCR processing is handled asynchronously to avoid blocking the UI.
-   **Error Handling:** The application includes error handling to gracefully manage API errors and other issues.

## Deployment

The application is deployed on Vercel. The deployment process is as follows:

-   **Build Command:** `npm run build`
-   **Output Folder:** `dist`
-   **Environment Variables:** The application uses an environment variable for the Gemini 2.0 API key.

## Scalability Notes

-   **User Authentication:** The application can be extended to include user authentication to manage access to the system.
-   **Cloud Storage:** The application can be integrated with cloud storage services like Amazon S3 or Google Cloud Storage to store uploaded files.
-   **Database Integration:** The application can be integrated with a database to store extracted data and user information.

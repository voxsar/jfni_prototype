<?php

require __DIR__.'/../vendor/autoload.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple router for API endpoints
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Health check
if ($uri === '/api/health' && $method === 'GET') {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'ok',
        'timestamp' => time(),
        'service' => 'Dieline App API'
    ]);
    exit();
}

// Upload PDF
if ($uri === '/api/upload-pdf' && $method === 'POST') {
    header('Content-Type: application/json');
    
    if (!isset($_FILES['pdf'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No PDF file provided']);
        exit();
    }
    
    $file = $_FILES['pdf'];
    $uploadDir = __DIR__ . '/../storage/pdfs/';
    
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    $filename = uniqid() . '_' . basename($file['name']);
    $uploadPath = $uploadDir . $filename;
    
    if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
        echo json_encode([
            'success' => true,
            'path' => 'pdfs/' . $filename,
            'filename' => $file['name'],
            'size' => $file['size']
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to upload file']);
    }
    exit();
}

// Projects endpoints
if (preg_match('#^/api/projects/?$#', $uri)) {
    header('Content-Type: application/json');
    
    if ($method === 'GET') {
        echo json_encode(['success' => true, 'data' => []]);
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        echo json_encode([
            'success' => true,
            'id' => uniqid('project_'),
            'message' => 'Project saved successfully'
        ]);
    }
    exit();
}

if (preg_match('#^/api/projects/([a-zA-Z0-9_]+)$#', $uri, $matches)) {
    header('Content-Type: application/json');
    $projectId = $matches[1];
    
    if ($method === 'GET') {
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => $projectId,
                'name' => 'Sample Project',
                'data' => []
            ]
        ]);
    } elseif ($method === 'PUT') {
        echo json_encode(['success' => true, 'message' => 'Project updated']);
    } elseif ($method === 'DELETE') {
        echo json_encode(['success' => true, 'message' => 'Project deleted']);
    }
    exit();
}

// Export model
if ($uri === '/api/export-model' && $method === 'POST') {
    header('Content-Type: application/json');
    $data = json_decode(file_get_contents('php://input'), true);
    echo json_encode([
        'success' => true,
        'message' => 'Model exported successfully',
        'data' => $data
    ]);
    exit();
}

// 404
http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['error' => 'Not Found']);

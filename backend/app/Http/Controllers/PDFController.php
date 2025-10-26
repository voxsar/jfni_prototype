<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PDFController extends Controller
{
    public function upload(Request $request)
    {
        if (!$request->hasFile('pdf')) {
            return response()->json([
                'success' => false,
                'error' => 'No PDF file provided'
            ], 400);
        }

        $file = $request->file('pdf');
        
        if ($file->getClientOriginalExtension() !== 'pdf') {
            return response()->json([
                'success' => false,
                'error' => 'File must be a PDF'
            ], 400);
        }

        // Store the PDF
        $path = $file->store('pdfs', 'public');

        return response()->json([
            'success' => true,
            'path' => $path,
            'filename' => $file->getClientOriginalName(),
            'size' => $file->getSize()
        ]);
    }
}

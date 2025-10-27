<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::all();
        
        return response()->json([
            'success' => true,
            'data' => $projects
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'pdf_path' => 'nullable|string',
            'geometry_data' => 'nullable|array',
            'annotations' => 'nullable|array',
            'status' => 'nullable|string|in:draft,processing,completed,error'
        ]);

        $project = Project::create($validated);

        return response()->json([
            'success' => true,
            'id' => $project->id,
            'message' => 'Project saved successfully',
            'data' => $project
        ], 201);
    }

    public function show($id)
    {
        $project = Project::find($id);
        
        if (!$project) {
            return response()->json([
                'success' => false,
                'error' => 'Project not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $project
        ]);
    }

    public function update(Request $request, $id)
    {
        $project = Project::find($id);
        
        if (!$project) {
            return response()->json([
                'success' => false,
                'error' => 'Project not found'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'pdf_path' => 'nullable|string',
            'geometry_data' => 'nullable|array',
            'annotations' => 'nullable|array',
            'status' => 'nullable|string|in:draft,processing,completed,error'
        ]);

        $project->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Project updated successfully',
            'data' => $project
        ]);
    }

    public function destroy($id)
    {
        $project = Project::find($id);
        
        if (!$project) {
            return response()->json([
                'success' => false,
                'error' => 'Project not found'
            ], 404);
        }

        $project->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project deleted successfully'
        ]);
    }

    public function exportModel(Request $request)
    {
        $data = $request->all();

        return response()->json([
            'success' => true,
            'message' => 'Model exported successfully',
            'data' => $data
        ]);
    }
}

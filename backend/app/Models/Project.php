<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'pdf_path',
        'geometry_data',
        'annotations',
        'status'
    ];

    protected $casts = [
        'geometry_data' => 'array',
        'annotations' => 'array'
    ];
}

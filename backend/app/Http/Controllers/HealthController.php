<?php

namespace App\Http\Controllers;

class HealthController extends Controller
{
    public function check()
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => time(),
            'service' => 'Dieline App API',
            'version' => '1.0.0'
        ]);
    }
}

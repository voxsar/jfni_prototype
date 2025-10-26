# FilamentPHP Admin Panel Setup Guide

This guide shows how to add FilamentPHP admin panel to the Dieline Folding App backend.

## What is FilamentPHP?

FilamentPHP is a modern admin panel and form builder for Laravel applications. It provides:
- Auto-generated CRUD interfaces
- Resource management
- User authentication
- Dashboard widgets
- File uploads
- Relationships handling

## Prerequisites

- Laravel backend running
- Composer installed
- Database configured (MySQL from docker-compose.yml)

## Installation Steps

### 1. Install FilamentPHP

```bash
cd backend
composer require filament/filament:"^3.0"
```

### 2. Install Filament Panels

```bash
php artisan filament:install --panels
```

This creates:
- Admin panel at `/admin`
- Admin user authentication
- Dashboard

### 3. Create Admin User

```bash
php artisan make:filament-user
```

Enter details:
- Name: Admin
- Email: admin@example.com
- Password: password (change this!)

### 4. Create Project Resource

```bash
php artisan make:filament-resource Project
```

This generates:
- `app/Filament/Resources/ProjectResource.php`
- `app/Filament/Resources/ProjectResource/Pages/`
  - ListProjects.php
  - CreateProject.php
  - EditProject.php

### 5. Configure Project Resource

Edit `app/Filament/Resources/ProjectResource.php`:

```php
<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProjectResource\Pages;
use App\Models\Project;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ProjectResource extends Resource
{
    protected static ?string $model = Project::class;

    protected static ?string $navigationIcon = 'heroicon-o-cube';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(255),
                
                Forms\Components\Textarea::make('description')
                    ->maxLength(65535)
                    ->columnSpanFull(),
                
                Forms\Components\FileUpload::make('pdf_path')
                    ->label('PDF File')
                    ->acceptedFileTypes(['application/pdf'])
                    ->directory('pdfs')
                    ->downloadable(),
                
                Forms\Components\KeyValue::make('geometry_data')
                    ->label('Geometry Data')
                    ->columnSpanFull(),
                
                Forms\Components\KeyValue::make('annotations')
                    ->label('Annotations')
                    ->columnSpanFull(),
                
                Forms\Components\Select::make('status')
                    ->options([
                        'draft' => 'Draft',
                        'processing' => 'Processing',
                        'completed' => 'Completed',
                        'error' => 'Error',
                    ])
                    ->default('draft')
                    ->required(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'draft' => 'gray',
                        'processing' => 'warning',
                        'completed' => 'success',
                        'error' => 'danger',
                    }),
                
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'draft' => 'Draft',
                        'processing' => 'Processing',
                        'completed' => 'Completed',
                        'error' => 'Error',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListProjects::route('/'),
            'create' => Pages\CreateProject::route('/create'),
            'edit' => Pages\EditProject::route('/{record}/edit'),
        ];
    }
}
```

### 6. Update Database

Make sure the projects table exists:

```bash
php artisan migrate
```

If you get migration errors, the migration file already exists at:
`backend/database/migrations/2024_01_01_000000_create_projects_table.php`

### 7. Start the Server

```bash
php artisan serve --host=0.0.0.0 --port=3003
```

Or with Docker:
```bash
docker-compose up --build
```

### 8. Access Admin Panel

Navigate to: http://localhost:3003/admin

Login with the admin user you created.

## Using the Admin Panel

### Dashboard
- View statistics
- Quick access to resources
- Custom widgets (can be added)

### Projects Management
1. **List Projects**: View all projects in a table
2. **Create Project**: Add new project with form
3. **Edit Project**: Update existing project
4. **Delete Project**: Remove project
5. **Search**: Find projects by name
6. **Filter**: Filter by status

### File Uploads
- PDF files are uploaded to `storage/app/public/pdfs/`
- Create storage symlink: `php artisan storage:link`
- Files are accessible at `/storage/pdfs/filename.pdf`

## Customization

### Add Dashboard Widgets

Create a widget:
```bash
php artisan make:filament-widget StatsOverview
```

Edit `app/Filament/Widgets/StatsOverview.php`:
```php
<?php

namespace App\Filament\Widgets;

use App\Models\Project;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends BaseWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Total Projects', Project::count())
                ->description('All time projects')
                ->descriptionIcon('heroicon-m-cube')
                ->color('success'),
            
            Stat::make('Draft Projects', Project::where('status', 'draft')->count())
                ->description('Projects in draft')
                ->descriptionIcon('heroicon-m-pencil')
                ->color('warning'),
            
            Stat::make('Completed Projects', Project::where('status', 'completed')->count())
                ->description('Successfully completed')
                ->descriptionIcon('heroicon-m-check-circle')
                ->color('success'),
        ];
    }
}
```

### Add Custom Actions

In ProjectResource table method:
```php
->actions([
    Tables\Actions\Action::make('export3D')
        ->icon('heroicon-o-arrow-down-tray')
        ->action(fn (Project $record) => redirect()->route('export', $record)),
    Tables\Actions\EditAction::make(),
    Tables\Actions\DeleteAction::make(),
])
```

### Add Navigation Groups

In ProjectResource:
```php
protected static ?string $navigationGroup = 'Design Management';
protected static ?int $navigationSort = 1;
```

## Advanced Features

### Add PDF Preview

In form method:
```php
Forms\Components\View::make('filament.components.pdf-preview')
    ->label('PDF Preview')
    ->columnSpanFull()
```

Create `resources/views/filament/components/pdf-preview.blade.php`:
```blade
<div class="border rounded p-4">
    @if($getRecord()?->pdf_path)
        <embed src="{{ Storage::url($getRecord()->pdf_path) }}" 
               type="application/pdf" 
               width="100%" 
               height="600px" />
    @else
        <p class="text-gray-500">No PDF uploaded yet</p>
    @endif
</div>
```

### Add JSON Preview for Geometry Data

```php
Forms\Components\ViewField::make('geometry_data_preview')
    ->view('filament.forms.components.json-preview')
    ->label('Geometry Preview')
    ->columnSpanFull()
```

### Add Relationship to Users

Create user relationship:
```bash
php artisan make:migration add_user_id_to_projects_table
```

In migration:
```php
$table->foreignId('user_id')->constrained()->onDelete('cascade');
```

Update Project model:
```php
public function user()
{
    return $this->belongsTo(User::class);
}
```

Add to ProjectResource form:
```php
Forms\Components\Select::make('user_id')
    ->relationship('user', 'name')
    ->searchable()
    ->preload()
    ->required(),
```

## API Integration with Admin Panel

Update controllers to use admin panel data:

`app/Http/Controllers/ProjectController.php`:
```php
public function index()
{
    $projects = Project::with('user')->get();
    return response()->json([
        'success' => true,
        'data' => $projects
    ]);
}

public function store(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string',
        'data' => 'required|array'
    ]);

    $project = Project::create([
        'name' => $validated['name'],
        'geometry_data' => $validated['data'],
        'status' => 'draft'
    ]);

    return response()->json([
        'success' => true,
        'id' => $project->id,
        'message' => 'Project saved successfully'
    ]);
}
```

## Production Deployment

1. **Disable Debug Mode**
   ```
   APP_DEBUG=false
   ```

2. **Optimize**
   ```bash
   php artisan optimize
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

3. **Secure Admin Panel**
   ```php
   // config/filament.php
   'domain' => env('FILAMENT_DOMAIN'),
   'path' => env('FILAMENT_PATH', 'admin'),
   ```

4. **Add Two-Factor Authentication**
   ```bash
   composer require filament/filament-2fa
   ```

## Resources

- FilamentPHP Documentation: https://filamentphp.com/docs
- Laravel Documentation: https://laravel.com/docs
- Filament Examples: https://github.com/filamentphp/demo
- Filament Community: https://filamentphp.com/community

## Troubleshooting

### "Class not found" errors
```bash
composer dump-autoload
php artisan optimize:clear
```

### Admin panel not accessible
- Check route: `php artisan route:list | grep admin`
- Clear cache: `php artisan config:clear`
- Verify user exists: Check `users` table

### File uploads not working
```bash
php artisan storage:link
chmod -R 775 storage
chown -R www-data:www-data storage
```

### Styling issues
```bash
npm install
npm run build
php artisan filament:assets
```

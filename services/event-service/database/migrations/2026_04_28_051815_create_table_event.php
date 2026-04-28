<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('location');
            $table->dateTime('event_date');
            $table->unsignedBigInteger('organizer_id');
            $table->enum('status', ['scheduled', 'ongoing', 'cancelled', 'completed'])->default('scheduled');
            $table->timestamps('created_at', 'updated_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};

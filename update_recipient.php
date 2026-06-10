<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ReportSetting;

$s = ReportSetting::current();
$s->recipients = ['m.kedidimetse@smartplanblueprint.net, p.chalebgwa@smartplanblueprint.net'];
$s->save();
echo implode(', ', $s->normalizedRecipients());
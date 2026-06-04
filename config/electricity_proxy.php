<?php

return [

    'provider_url' => env('ELECTRICITY_PROXY_PROVIDER_URL'),

    'provider_authorization' => env('ELECTRICITY_PROXY_PROVIDER_AUTHORIZATION'),

    'fake' => filter_var(env('ELECTRICITY_PROXY_FAKE', false), FILTER_VALIDATE_BOOLEAN),

    'purchase_fake' => filter_var(env('ELECTRICITY_PURCHASE_FAKE', false), FILTER_VALIDATE_BOOLEAN),

    'verify_fake' => filter_var(env('ELECTRICITY_VERIFY_FAKE', false), FILTER_VALIDATE_BOOLEAN),

];

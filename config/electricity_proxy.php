<?php

return [

    'provider_url' => env('ELECTRICITY_PROXY_PROVIDER_URL'),

    'provider_authorization' => env('ELECTRICITY_PROXY_PROVIDER_AUTHORIZATION'),

    'fake' => filter_var(env('ELECTRICITY_PROXY_FAKE', false), FILTER_VALIDATE_BOOLEAN),

];

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ElectricityController extends Controller
{
    public function baseurl(){
        return "https://production.finclude.co.za";
    }

    public function secondelectricity(){
        return "https://us-central1-develop-prepaidplus.cloudfunctions.net/pos";
    }

    public function verifycustomer(Request $request){
       
        $validator = Validator::make($request->all(), [
            'transID' => 'required',
            'meterNumber' => 'required',
            'amount' => 'required|numeric|min:10',
            'email'=> 'required',
            'password' => 'required'
        ]);

        if ($validator->fails()) {
            return Response()->json(["result"=>"FAILED",
                "message"=>"Please provide required fields or provide amount as interger with a minimun of 10.",
                'details' => null]);
        }
        $api_token = "";

        if (auth()->attempt(['email' => $request->email, 'password' => $request->password])) {
            $user = auth()->user();
            $user->api_token = Str::random(60);
            $user->save();
            $api_token = $user->api_token;
        }else{
            return response()->json([
                'results' => 'FAILED',
                'message' => "Authentication Failed",
                'details' => null
            ], 200);
        }

        $client = new \GuzzleHttp\Client();
        $transactionid = $request->transID;
        $meternumber = $request->meterNumber;
        $amount = $request->amount;

        //jfskjfkjsfjsd
// 
        try{
	           
	        $client = new \GuzzleHttp\Client();
	        $res = $client->request('POST',
	            'https://us-central1-prod-prepaidplus.cloudfunctions.net/api/trialcreditvendApiKey', [
	                'body' => json_encode([
	                 'meterNumber' => $meternumber, 
	                    'transactionAmount' => (float)$amount,
	                    'clientSaleId'=>$transactionid,
	                    'createdBy'=>'SmartPlan BluePrint'
	                    ]),
	                'headers' => [
	                    'Authorization'=> 'Basic dm1pdlVRQ3FGd0xwUWhwSVhPaDU6cVJqVEVOcFFNaHdkOE1ieg',
	                    'Content-Type'=> 'application/json',
	                ]
	        ]);

	        $serverresponse = $res->getBody()->getContents();
	        $resultsinfo = json_decode($serverresponse);
	        try{
	        $info = $resultsinfo->custVendDetail;
	        return response()->json([
	            'results' => 'SUCCESS',
	            'message' => null,
	            'api_token'=>$api_token,
	            'elec_token'=>$meternumber,
	            'details' => [
	                'customer_name'=>$info->name,
	                'meter_number'=>$info->meterNumber
	            ],
	        ]);
        }catch(Exception $exp){
            return response()->json([
                'results' => 'FAILED1',
                'message' => "Blueprintelectricity experinced an error while purchasing electricity. Please try again later.",
                'details' => $exp
            ], 200); 
        }

    }catch(\GuzzleHttp\Exception\ClientException $e){
         return response()->json([
                'results' => 'FAILED1',
                'message' => "Blueprintelectricity experinced an error while purchasing electricity. Please try again later.",
                'details' => $e
            ], 200); 
           
    }




        //jfisjfjsdjf

        try{

	        $res = $client->request('POST',
	            $this->baseurl().'/rest/authentication/login', [
	                'body' => json_encode([
	                    'identity' => 'craftapi',
	                    'credential' => 'wegotthis_',
	                    'identityType'=>'USERNAME'
	                    ]),
	                'headers' => [
	                    'Content-Type'=> 'application/json',
	                ]
	        ]);
	       
	        $bearer = $res->getHeaders()['X-AUTH-TOKEN'][0];
	        $data = [
	            'txObjectId'=>271,
	            'threadId'=>72,
	            'scopeId'=>116,
	            'requesterIdentification'=>[
	                'identityType'=>'ANONYMOUS'
	            ],
	            "answerDeviceId"=>"craft_silicon",
	            "answerTransactionId"=>$transactionid,
	            "parameters"=>[
	                "integration.kazang.hidden.productId"=>"20004",
	                "integration.kazang.MeterNumber"=>$meternumber,
	                "SALE_VALUE"=>$amount
	            ]
	        ];

	        $jsondata =  json_encode($data);
	        $res = $client->request('POST',
	        $this->baseurl().'/rest/transaction/execute', [
	            'body' => $jsondata ,
	            'headers' => [
	                'Accept' => 'application/json',
	                'Authorization' => 'Bearer ' . $bearer,
	                'Content-Type' => 'application/json'
	            ]
	        ]);

	        $server_response = $res->getBody()->getContents();
	        $jsonresponse = json_decode($server_response);
	        if($jsonresponse->result == "SUCCESS"){
	        	$info = $jsonresponse->receiptItems;
	             return response()->json([
	                'results' => 'SUCCESS',
	                'message' => null,
	                'api_token'=>$api_token,
	                'elec_token'=>$bearer,
	                'details' => [
	                	'customer_name'=>$info->customer_name,
	                	'meter_number'=>$info->meter_number
	                ],
	            ]);
	        }else{
	            return response()->json([
                'results' => 'FAILED',
                'message' => "Blueprintelectricity experinced an error while purchasing electricity. Please try again later.",
                'details' => null
            ], 200);
	        }
	    }catch(\GuzzleHttp\Exception\ClientException $e){

	    	return response()->json([
                'results' => 'FAILED',
                'message' => "Blueprintelectricity experinced an error while purchasing electricity. Please try again later.",
                'details' => null
            ], 200);
	    	//return $this->prepaidplusconfirmelectricity();
	    	//return "error";
	    }
    }

    public function buyelectricity(Request $request){

        $validator = Validator::make($request->all(), [
            'transID' => 'required',
            'meterNumber' => 'required',
            'amount' => 'required|numeric|min:10',
            'elec_token'=>'required'
        ]);

        if ($validator->fails()) {
            return Response()->json(["result"=>"FAILED",
                "message"=>"Please provide required fields or provide amount as interger.",
                'type' => null]);
        }
        $api_token = "";
        $client = new \GuzzleHttp\Client();
        $transactionid = $request->transID;
        $meternumber = $request->meterNumber;
        $amount = $request->amount;

        return $this->prepaidplusconfirmelectricity($meternumber,$amount,$transactionid);   

 
        $bearer = $request->elec_token;
        $data = [
            'txObjectId'=>271,
            'threadId'=>71,
            'scopeId'=>116,
            'requesterIdentification'=>[
                'identityType'=>'ANONYMOUS'
            ],
            "answerDeviceId"=>"craft_silicon",
            "answerTransactionId"=>$transactionid,
            "parameters"=>[
                "integration.kazang.hidden.productId"=>"20004",
                "integration.kazang.MeterNumber"=>$meternumber,
                "SALE_VALUE"=>$amount
            ]
        ];

         try{

        $jsondata =  json_encode($data);
        $res = $client->request('POST',
        $this->baseurl().'/rest/transaction/execute', [
            'body' => $jsondata ,
            'headers' => [
                'Accept' => 'application/json',
                'Authorization' => 'Bearer ' . $bearer,
                'Content-Type' => 'application/json'
            ]
        ]);

        $server_response = $res->getBody()->getContents();
        $jsonresponse = json_decode($server_response);
        if($jsonresponse->result == "SUCCESS"){
        
        
        

        
        
        
             return response()->json([
                'results' => 'SUCCESS',
                'message' => null,
                'type' => "DISPLAY",
                'receiptItems'=>$jsonresponse->receiptItems
            ]);
        }else{
            //  return response()->json([
            //     'results' => 'FAILED',
            //     'message' => str_replace("Kazang", "Blueprintelectricity",$jsonresponse->message),
            //     'type' => "DISPLAY"
            // ]);
            return response()->json([
                'results' => 'FAILED',
                'message' => "Blueprintelectricity experinced an error while purchasing electricity. Please try again later.",
                'details' => null
            ], 200);
        }
        }catch(\GuzzleHttp\Exception\ClientException $e){

            return response()->json([
                'results' => 'FAILED',
                'message' => "Blueprintelectricity experinced an error while purchasing electricity. Please try again later.",
                'details' => null
            ], 200); 
           // return $this->prepaidplusconfirmelectricity($meternumber,$amount);
            //return "error";
        }
      //  return Response()->json($jsonresponse);

   }






   public function prepaidplusconfirmelectricity($meternumber, $amount,$transid){
   	
        try{

        $client = new \GuzzleHttp\Client();
        $res = $client->request('POST',
            'https://us-central1-prod-prepaidplus.cloudfunctions.net/api/bpcSaleApiKey', [
                'body' => json_encode([
                    'meterNumber' => $meternumber, 
                    'transactionAmount' => (float)$amount,
                    'clientSaleId'=>$transid,
                    'createdBy'=>'Standard Chartered',
                    ]),
                'headers' => [
                    'Authorization'=> 'Basic dm1pdlVRQ3FGd0xwUWhwSVhPaDU6cVJqVEVOcFFNaHdkOE1ieg',
                    'Content-Type'=> 'application/json',
                ]
        ]);

        $serverresponse = $res->getBody()->getContents();

        $resultsinfo = json_decode($serverresponse);
                           
        if($resultsinfo->response == "Successful"){
            $receiptitems = $resultsinfo->creditVendReceipt;
            
            $curl = curl_init();

			curl_setopt_array($curl, array(
  				CURLOPT_URL => 'https://peter.smartplanblueprint.net/api/SCT_SELL',
  				CURLOPT_RETURNTRANSFER => true,
 				CURLOPT_ENCODING => '',
  				CURLOPT_MAXREDIRS => 10,
  				CURLOPT_TIMEOUT => 0,
  				CURLOPT_FOLLOWLOCATION => true,
  				CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  				CURLOPT_CUSTOMREQUEST => 'POST',
 				CURLOPT_POSTFIELDS => array('amount' => $amount),
			));

			curl_exec($curl);
			curl_close($curl);
			
			$curl = curl_init();

			curl_setopt_array($curl, array(
  				CURLOPT_URL => 'https://peter.smartplanblueprint.net/api/SCT_TRANS_DAGI',
  				CURLOPT_RETURNTRANSFER => true,
  				CURLOPT_ENCODING => '',
  				CURLOPT_MAXREDIRS => 10,
  				CURLOPT_TIMEOUT => 0,
  				CURLOPT_FOLLOWLOCATION => true,
  				CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  				CURLOPT_CUSTOMREQUEST => 'POST',
  				CURLOPT_POSTFIELDS => array(
  					'amount' => $amount,
  					'service' => 'Electricity',
  					'servicenumber' => $meternumber,
  					'voucher' => str_replace(' ', '', $receiptitems->stsCipher),
  					'status' => 'Processed',
  					'trans_id' => $receiptitems->receiptNo
  				),
			));

			curl_exec($curl);
			curl_close($curl);



            return Response()->json([
                "results"=> "SUCCESS",
                "message"=> null,
                "type"=> "DISPLAY",
                "receiptItems"=>[
                    "customer_address"=>null,
                    "notes" => [],
                    "receipt_no"=>$receiptitems->receiptNo,
                    "DateTime"=>$receiptitems->date,
                    "utility_details"=>[
                        "address"=>null,
                        "vat_number"=>null,
                        "name"=>$receiptitems->name,
                        "contact_number"=>null,
                    ],
                    "Cashier"=>"Smartblueprient",
                    "reprint"=>false,
                    "customer_account_no"=>$receiptitems->account,
                    "tariff_name"=>$receiptitems->tariff,
                    "fee_details"=>[
                        [
                        "amount"=>strval(($receiptitems->standardCharge + $receiptitems->governmentLevy)),
                        "tax"=>'0.00',
                        "desc"=>'Total Excise Duty'
                        ],
                        [
                        "amount"=>$receiptitems->vat,
                        "tax"=>'0.00',
                        "desc"=>"Total VAT"
                        ]
                    ],
                    "customer_messages"=>[
                        "Credit Vend"
                    ],
                    "totals"=>[
                        "tendered"=>$receiptitems->amtTendered,
                        "fees"=>strval(($receiptitems->standardCharge + $receiptitems->governmentLevy+$receiptitems->vat)),
                        "total"=>$receiptitems->amtTendered,
                        "fbe_units"=>"",
                        "elec"=>$receiptitems->costUnits,
                        "debt_remaining"=>"0.00",
                        "tax"=>"",
                        "units"=>$receiptitems->tokenUnits,
                        "debt"=>"",
                        "debt_opening_bal"=>"0.00"
                    ],
                    "fbe_tokens"=>[],
                    "external_client_id"=>"PP001",
                    "customer_location_ref"=>$receiptitems->location,
                    "std_tokens"=>[
                        [
                            "amount"=>$receiptitems->costUnits,
                            "code"=>str_replace(' ', '', $receiptitems->stsCipher),
/*"code" => sprintf('%s %s %s',
                                    str_replace(' ', '', $receiptitems->keychangetoken1),
                                    str_replace(' ', '', $receiptitems->keychangetoken2),str_replace(' ', '', $receiptitems->stsCipher)),*/
                            "receipt"=>$receiptitems->receiptNo,
                            "tax"=>"0.00",
                            "tariff"=>"",
                            "units"=>"",
                            "sort_order"=>"1",
                            "desc"=>"General TaxRes Step 0"
                        ]
                    ],
                    "meter_details"=>[
                        "tt"=>"",
                        "number"=>$receiptitems->meterNumber,
                        "sgc_ti"=>strval($receiptitems->sgc.'/'.$receiptitems->ti),
                        "ti"=>$receiptitems->ti,
                        "krn"=>$receiptitems->krn,
                        "alg"=>"",
                        "sgc"=>$receiptitems->sgc
                    ],
                    "token_gen_time"=>$receiptitems->date,
                    "external_reference_number"=>$receiptitems->receiptNo,
                    "debt_details"=>[],
                    "tariff_blocks"=>[],
                    "ReceiptNo"=>$receiptitems->receiptNo,
                    "customer_name"=>$receiptitems->name,
                    "AmountTendered"=>$receiptitems->amtTendered
                ] 
            ]);
        }else{
            return response()->json([
                    'results' => 'FAILED',
                    'message' => "Blueprintelectricity experinced an error while purchasing electricity. Please try again later.",
                    'details' => null
                ], 200); 
        }
    }catch(\GuzzleHttp\Exception\ClientException $e){

         return response()->json([
                'results' => 'FAILED',
                'message' => "Blueprintelectricity experinced an error while purchasing electricity. Please try again later.",
                'details' => null
            ], 200); 
            //return $this->prepaidplusconfirmelectricity();
            //return "error";
    }
 	
   }



       public function verifycustomer1(Request $request){
       
        $validator = Validator::make($request->all(), [
            'transID' => 'required',
            'meterNumber' => 'required',
            'amount' => 'required|numeric|min:10',
            
        ]);

        if ($validator->fails()) {
            return Response()->json(["result"=>"FAILED",
                "message"=>"Please provide required fields or provide amount as interger with a minimun of 10.",
                'details' => null]);
        }
        $api_token = "";

        

        $client = new \GuzzleHttp\Client();
        $transactionid = $request->transID;
        $meternumber = $request->meterNumber;
        $amount = $request->amount;

        //jfskjfkjsfjsd

        try{
	           
	        $client = new \GuzzleHttp\Client();
	        $res = $client->request('POST',
	            'https://us-central1-prod-prepaidplus.cloudfunctions.net/api/trialcreditvendApiKey', [
	                'body' => json_encode([
	                    'meterNumber' => $meternumber, 
	                    'transactionAmount' => (float)$amount,
	                    'clientSaleId'=>$transactionid,
	                    'createdBy'=>'SmartPlan BluePrint'
	                    ]),
	                'headers' => [
	                    'Authorization'=> 'Basic dm1pdlVRQ3FGd0xwUWhwSVhPaDU6cVJqVEVOcFFNaHdkOE1ieg',
	                    'Content-Type'=> 'application/json',
	                ]
	        ]);

	        $serverresponse = $res->getBody()->getContents();
	        $resultsinfo = json_decode($serverresponse);
	        try{
	        $info = $resultsinfo->custVendDetail;
	        return response()->json([
	            'results' => 'SUCCESS',
	            'message' => null,
	            'api_token'=>$api_token,
	            'elec_token'=>$meternumber,
	            'details' => [
	                'customer_name'=>$info->name,
	                'meter_number'=>$info->meterNumber
	            ],
	        ]);
        }catch(Exception $exp){
            return response()->json([
                'results' => 'FAILED1',
                'message' => "Blueprintelectricity experinced an error while purchasing electricity. Please try again later.",
                'details' => $exp
            ], 200); 
        }

    }catch(\GuzzleHttp\Exception\ClientException $e){
         return response()->json([
                'results' => 'FAILED1',
                'message' => "Blueprintelectricity experinced an error while purchasing electricity. Please try again later.",
                'details' => $e
            ], 200); 
           
    }




        //jfisjfjsdjf

        try{

	        $res = $client->request('POST',
	            $this->baseurl().'/rest/authentication/login', [
	                'body' => json_encode([
	                    'identity' => 'craftapi',
	                    'credential' => 'wegotthis_',
	                    'identityType'=>'USERNAME'
	                    ]),
	                'headers' => [
	                    'Content-Type'=> 'application/json',
	                ]
	        ]);
	       
	        $bearer = $res->getHeaders()['X-AUTH-TOKEN'][0];
	        $data = [
	            'txObjectId'=>271,
	            'threadId'=>72,
	            'scopeId'=>116,
	            'requesterIdentification'=>[
	                'identityType'=>'ANONYMOUS'
	            ],
	            "answerDeviceId"=>"craft_silicon",
	            "answerTransactionId"=>$transactionid,
	            "parameters"=>[
	                "integration.kazang.hidden.productId"=>"20004",
	                "integration.kazang.MeterNumber"=>$meternumber,
	                "SALE_VALUE"=>$amount
	            ]
	        ];

	        $jsondata =  json_encode($data);
	        $res = $client->request('POST',
	        $this->baseurl().'/rest/transaction/execute', [
	            'body' => $jsondata ,
	            'headers' => [
	                'Accept' => 'application/json',
	                'Authorization' => 'Bearer ' . $bearer,
	                'Content-Type' => 'application/json'
	            ]
	        ]);

	        $server_response = $res->getBody()->getContents();
	        $jsonresponse = json_decode($server_response);
	        if($jsonresponse->result == "SUCCESS"){
	        	$info = $jsonresponse->receiptItems;
	             return response()->json([
	                'results' => 'SUCCESS',
	                'message' => null,
	                'api_token'=>$api_token,
	                'elec_token'=>$bearer,
	                'details' => [
	                	'customer_name'=>$info->customer_name,
	                	'meter_number'=>$info->meter_number
	                ],
	            ]);
	        }else{
	            return response()->json([
                'results' => 'FAILED',
                'message' => "Blueprintelectricity experinced an error while purchasing electricity. Please try again later.",
                'details' => null
            ], 200);
	        }
	    }catch(\GuzzleHttp\Exception\ClientException $e){

	    	return response()->json([
                'results' => 'FAILED',
                'message' => "Blueprintelectricity experinced an error while purchasing electricity. Please try again later.",
                'details' => null
            ], 200);
	    	//return $this->prepaidplusconfirmelectricity();
	    	//return "error";
	    }
    }
}

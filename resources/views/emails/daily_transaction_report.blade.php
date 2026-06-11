<!doctype html>
<html>
<body style="margin:0;padding:0;background:#eef4ff;font-family:Arial,sans-serif;color:#071a33;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef4ff;padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border:1px solid #b2c7e6;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:24px;background:#0b3a78;color:#ffffff;">
              <div style="font-size:12px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;color:#bcd7ff;">Daily report</div>
              <h1 style="margin:8px 0 0;font-size:24px;line-height:1.2;">Smart Plan Blueprint</h1>
              <p style="margin:8px 0 0;color:#dbe8ff;">{{ $from->toDateString() }} to {{ $to->toDateString() }}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 18px;line-height:1.6;">Attached is the daily Excel transaction report.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Total transactions</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ ($combined_summary['total_count'] ?? $summary['total_count']) }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Successful</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ ($combined_summary['success_count'] ?? $summary['success_count']) }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Failed</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ ($combined_summary['failed_count'] ?? $summary['failed_count']) }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Pending / other</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ ($combined_summary['pending_count'] ?? $summary['pending_count'] ?? 0) }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;color:#536985;">Successful amount</td>
                  <td align="right" style="padding:10px;font-weight:bold;">BWP {{ number_format($combined_summary['total_amount'] ?? $summary['total_amount'], 2) }}</td>
                </tr>
              </table>

            @if(!empty($airtime_summary) && $airtime_summary['total_count'] > 0)
              <h2 style="margin:28px 0 12px;font-size:16px;color:#071a33;border-bottom:2px solid #b2c7e6;padding-bottom:6px;">Electricity Transactions</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Total transactions</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ $summary['total_count'] }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Successful</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ $summary['success_count'] }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Failed</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ $summary['failed_count'] }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Pending</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ $summary['pending_count'] }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Success rate</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ $summary['success_rate'] }}%</td>
                </tr>
                <tr>
                  <td style="padding:10px;color:#536985;">Successful amount</td>
                  <td align="right" style="padding:10px;font-weight:bold;">BWP {{ number_format($summary['total_amount'], 2) }}</td>
                </tr>
              </table>

              <h2 style="margin:28px 0 12px;font-size:16px;color:#071a33;border-bottom:2px solid #b2c7e6;padding-bottom:6px;">Airtime Transactions</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Total transactions</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ $airtime_summary['total_count'] }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Successful</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ $airtime_summary['success_count'] }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Failed</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ $airtime_summary['failed_count'] }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Success rate</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ $airtime_summary['success_rate'] }}%</td>
                </tr>
                <tr>
                  <td style="padding:10px;color:#536985;">Successful amount</td>
                  <td align="right" style="padding:10px;font-weight:bold;">BWP {{ number_format($airtime_summary['total_amount'], 2) }}</td>
                </tr>
              </table>
            @endif

            @if(!empty($airtime_summary) && $airtime_summary['total_count'] > 0)
              <h2 style="margin:28px 0 12px;font-size:16px;color:#071a33;border-bottom:2px solid #b2c7e6;padding-bottom:6px;">Combined Summary</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Electricity</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ $summary['total_count'] }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Airtime</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ $airtime_summary['total_count'] }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Total transactions</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ $combined_summary['total_count'] }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Successful</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ $combined_summary['success_count'] }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Failed</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ $combined_summary['failed_count'] }}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #dce7f7;color:#536985;">Success rate</td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #dce7f7;font-weight:bold;">{{ $combined_summary['success_rate'] }}%</td>
                </tr>
                <tr>
                  <td style="padding:10px;color:#536985;">Successful amount</td>
                  <td align="right" style="padding:10px;font-weight:bold;">BWP {{ number_format($combined_summary['total_amount'], 2) }}</td>
                </tr>
              </table>
            @endif

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

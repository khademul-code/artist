<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title></title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f6f9">
    <tr>
        <td align="center" style="padding:30px 15px;">

            <table width="600" cellpadding="0" cellspacing="0" border="0"
                   style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

                {{-- ===== Header ===== --}}
                @if ($status === 'approved')
                    <tr>
                        <td align="center" bgcolor="#16a34a" style="padding:30px 20px;">
                            <h2 style="margin:0;color:#ffffff;font-size:28px;">🎉 You're Approved!</h2>
                        </td>
                    </tr>

                @else
                    <tr>
                        <td align="center" bgcolor="#d97706" style="padding:30px 20px;">
                            <h2 style="margin:0;color:#ffffff;font-size:28px;">⚠️ Action Required</h2>
                        </td>
                    </tr>
                @endif

                {{-- ===== Body ===== --}}
                <tr>
                    <td style="padding:35px 30px;color:#333333;font-size:16px;line-height:1.8;">

                        <p style="margin-top:0;">
                            Hello <strong>{{ $user->name }}</strong>,
                        </p>

                        @if ($status === 'approved')

                            <p>
                                Great news! Your JBA company card for
                                <strong>{{ $companyInfo->company_name ?? 'your company' }}</strong>
                                has been reviewed and <strong style="color:#16a34a;">approved</strong> by our team.
                            </p>
                            <p>
                                Your card is now officially published on the JBA board and visible to all members and visitors.
                            </p>

                            {{-- CTA --}}
                            <p style="text-align:center;margin:35px 0;">
                                <a href="{{ rtrim(env('FRONTEND_URL'), '/') }}" target="_blank"
                                    style="background:#16a34a;color:#ffffff;text-decoration:none;padding:15px 35px;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">
                                    View Your Card
                                </a>
                            </p>

                            <p>
                                Thank you for joining the Jewelry Board of America. We look forward to showcasing your business!
                            </p>



                        @else {{-- requires_changes --}}

                            <p>
                                Thank you for submitting your company card for
                                <strong>{{ $companyInfo->company_name ?? 'your company' }}</strong>.
                                Our team has reviewed your submission and requires a few changes before it can be approved.
                            </p>

                            @if ($companyInfo->admin_notes)
                                {{-- Notes box --}}
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin:25px 0;">
                                    <tr>
                                        <td style="padding:20px;background:#fffbeb;border-left:4px solid #d97706;border-radius:4px;">
                                            <div style="font-size:13px;font-weight:bold;color:#d97706;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">
                                                Changes Requested
                                            </div>
                                            <div style="font-size:15px;color:#78350f;line-height:1.6;">
                                                {{ $companyInfo->admin_notes }}
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            @endif

                            <p>
                                Please log in to your account, update your company profile with the changes listed above, and resubmit for review.
                            </p>

                            {{-- CTA --}}
                            <p style="text-align:center;margin:35px 0;">
                                <a href="{{ rtrim(env('FRONTEND_URL'), '/') }}/company-info" target="_blank"
                                   style="background:#d97706;color:#ffffff;text-decoration:none;padding:15px 35px;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">
                                    Update My Profile
                                </a>
                            </p>

                        @endif

                        <p style="margin-bottom:0;">
                            If you have any questions, please contact our support team at
                            <a href="mailto:contact@jbamerica.net">contact@jbamerica.net</a>.<br>
                            Thank you,<br>
                            <strong>{{ $systemSettings?->system_name ?? config('app.name') }}</strong> Team
                        </p>

                    </td>
                </tr>

                {{-- ===== Footer ===== --}}
                <tr>
                    <td align="center"
                        style="padding:25px 20px;background:#fafafa;border-top:1px solid #eeeeee;color:#777777;font-size:13px;line-height:1.7;">

                        {{ $systemSettings?->address ?? '7777 Davie Road Extension, Hollywood, FL 33024, USA' }}
                        <br><br>

                        © {{ date('Y') }}
                        {{ $systemSettings?->system_name ?? config('app.name') }}.
                        All rights reserved.

                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>

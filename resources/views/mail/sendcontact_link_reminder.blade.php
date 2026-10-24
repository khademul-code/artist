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

            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

                <!-- Header -->
                <tr>
                    <td align="center" bgcolor="#3490dc" style="padding:30px 20px;">
                        <h2 style="margin:0;color:#ffffff;font-size:28px;">
                            Complete Your Company Profile
                        </h2>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="padding:35px 30px;color:#333333;font-size:16px;line-height:1.8;">

                        <p style="margin-top:0;">
                            Hello <strong>{{ $companyInfo->user->name ?? 'User' }}</strong>,
                        </p>

                        <p>
                            We noticed that your company
                            <strong>{{ $companyInfo->company_name ?? 'profile' }}</strong>
                            is missing a <strong>Company Mini Site Link</strong>.
                        </p>

                        <p>
                            Please add your Company Mini Site Link to complete your company
                            profile and make it easier for customers to contact you.
                        </p>

                        <!-- Highlight Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
                            <tr>
                                <td align="center"
                                    style="padding:20px;background:#f4f8ff;border:2px dashed #3490dc;border-radius:8px;">

                                    <div style="font-size:14px;color:#777;margin-bottom:8px;">
                                        Required Information
                                    </div>

                                    <div style="font-size:26px;font-weight:bold;color:#3490dc;">
                                        Company Mini Site Link
                                    </div>

                                </td>
                            </tr>
                        </table>

                        <p style="text-align:center;margin:35px 0;">

                            <a href="{{ rtrim(env('FRONTEND_URL'), '/') }}/company-info" target="_blank"
                               style="
                                    background:#3490dc;
                                    color:#ffffff;
                                    text-decoration:none;
                                    padding:15px 35px;
                                    border-radius:6px;
                                    font-size:16px;
                                    font-weight:bold;
                                    display:inline-block;
                                ">
                                Complete Company Profile
                            </a>

                        </p>

                        <p>
                            If you've already added your Company Mini Site Link, you can safely
                            ignore this email.
                        </p>

                        <p style="margin-bottom:0;">
                            Thank you,<br>
                            <strong>{{ $systemSettings?->system_name ?? config('app.name') }}</strong> Team
                        </p>

                    </td>
                </tr>

                <!-- Footer -->
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
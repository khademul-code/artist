<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title></title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7f6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        h1 {
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 20px;
        }
        p {
            line-height: 1.6;
            font-size: 16px;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #7f8c8d;
            border-top: 1px solid #ecf0f1;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, {{ $user->name }}!</h1>
        <p>Your company card has been submitted successfully.</p>
        <p>It is now temporarily published on the JBA board while our team reviews it for final approval.</p>
        <p>We will notify you when the review is complete.</p>
        <p>Thank you for joining the Jewelry Board of America.</p>
        <div class="footer">
            <p>If you did not submit this company card, please contact our support team immediately.</p>
        </div>
    </div>
</body>
</html>

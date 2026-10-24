<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CompanyProfileSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your JBA Company Card Has Been Submitted',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.company_profile_submitted',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

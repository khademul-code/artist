<?php

namespace App\Mail;

use App\Models\CompanyInformation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class JewelryCardStatusUpdated extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;
    public CompanyInformation $companyInfo;
    public string $status;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, CompanyInformation $companyInfo, string $status)
    {
        $this->user        = $user;
        $this->companyInfo = $companyInfo;
        $this->status      = $status;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subjects = [
            'approved'         => 'Your JBA Company Card Has Been Approved 🎉',
            'requires_changes' => 'Action Required: Changes Needed for Your JBA Company Card',
        ];

        return new Envelope(
            subject: $subjects[$this->status] ?? 'Update on Your JBA Company Card',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.jewelry_card_status_updated',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

import { z } from 'zod';
import { sendCustomEmail } from '../services/email.service.js';

const emailSchema = z.object({
    to: z.string().email('Email destinataire invalide'),
    subject: z.string().trim().min(1, 'Sujet requis').max(120, 'Sujet trop long'),
    message: z.string().trim().min(1, 'Message requis').max(5000, 'Message trop long'),
    name: z.string().trim().max(80, 'Nom trop long').optional(),
});

const contactSchema = z.object({
    name: z.string().trim().min(1, 'Nom requis').max(80),
    email: z.string().email('Email invalide'),
    message: z.string().trim().min(1, 'Message requis').max(5000),
    subject: z.string().trim().max(120).optional(),
});

export const sendEmail = async (req, res) => {
    try {
        const payload = emailSchema.parse(req.body);
        await sendCustomEmail(payload);
        res.json({ message: 'Email envoyé avec succès' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues[0]?.message || 'Données invalides' });
        }
        res.status(500).json({ error: "Impossible d'envoyer l'email" });
    }
};

export const sendContactEmail = async (req, res) => {
    try {
        const data = contactSchema.parse(req.body);
        await sendCustomEmail({
            to: 'sb.kherarfa@gmail.com',
            name: 'Sofiane Kherarfa',
            subject: data.subject || `[Contact Azim404] Message de ${data.name}`,
            message: `De : ${data.name} (${data.email})\n\nMessage :\n${data.message}`,
        });
        res.json({ message: 'Message envoyé avec succès' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues[0]?.message || 'Données invalides' });
        }
        res.status(500).json({ error: "Impossible d'envoyer le message" });
    }
};

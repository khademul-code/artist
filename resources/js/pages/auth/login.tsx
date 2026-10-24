import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Eye,
    EyeOff,
    Gem,
    Layers,
    LoaderCircle,
    Lock,
    Mail,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

function normalizeLogoSrc(src?: string | null) {
    if (!src) {
        return '/logo.svg';
    }

    if (/^(?:https?:)?\/\//.test(src)) {
        return src;
    }

    if (src.startsWith('/storage/uploads/')) {
        return `${typeof window !== 'undefined' ? window.location.origin : ''}/${src.replace('storage/', '')}`;
    }

    if (src.startsWith('storage/uploads/')) {
        return `${typeof window !== 'undefined' ? window.location.origin : ''}/${src.replace('storage/', '')}`;
    }

    if (src.startsWith('/uploads/')) {
        return `${typeof window !== 'undefined' ? window.location.origin : ''}${src}`;
    }

    if (src.startsWith('uploads/')) {
        return `${typeof window !== 'undefined' ? window.location.origin : ''}/${src}`;
    }

    if (src.startsWith('/')) {
        return src;
    }

    return `/${src}`;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { settings } = usePage().props as any;
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const currentYear = new Date().getFullYear();
    const systemName = settings?.system_name || 'JBA DIRECTORY';
    const copyrightText = settings?.copyright_text || `Copyright ${currentYear} ${systemName}. All rights reserved.`;

    return (
        <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-12 bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
            <Head title="Log in" />

            {/* ── Left Side: Dark Hero Section ── */}
            <div className="relative hidden lg:flex lg:col-span-7 xl:col-span-7 flex-col justify-between overflow-hidden bg-[#050B17] p-10 xl:p-14 2xl:p-16 text-white border-r border-slate-800/80">
                {/* Subtle Matrix / Dot Grid & Ambient Glows */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
                <div className="pointer-events-none absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-blue-600/15 blur-[120px]" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[130px]" />
                <div className="pointer-events-none absolute top-1/2 left-1/3 h-64 w-64 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />

                {/* Top Bar */}
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src={normalizeLogoSrc(settings?.logo)}
                            alt={systemName}
                            className="h-7 w-auto object-contain brightness-0 invert"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        <span className="text-sm font-bold tracking-wider text-white uppercase">
                            {systemName}
                        </span>
                        <span className="text-slate-600 font-light">|</span>
                        <span className="text-[11px] font-semibold tracking-widest text-blue-400 uppercase">
                            OPERATIONS ENGINE
                        </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300 shadow-sm backdrop-blur-sm">
                        Enterprise v1.0
                    </div>
                </div>

                {/* Middle Content */}
                <div className="relative z-10 my-auto py-12 max-w-2xl">
                    {/* Pill Tag */}
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-medium text-blue-400 shadow-sm backdrop-blur-sm">
                        <Sparkles className="size-3.5 text-blue-400" />
                        <span>Jewelry Network & Card Intelligence Portal</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl xl:text-5xl 2xl:text-[52px] font-extrabold tracking-tight text-white leading-[1.12]">
                        Elevate Artisan Representation & Directory Operations
                    </h1>

                    {/* Subtitle */}
                    <p className="mt-5 text-sm xl:text-base leading-relaxed text-slate-400 max-w-xl">
                        A centralized, state-of-the-art control panel for managing verified jewelry artisans,
                        mini-site cards, company profiles, and network listings.
                    </p>

                    {/* 3 Feature Cards */}
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 xl:gap-4">
                        <div className="group rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 xl:p-5 backdrop-blur-md transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80">
                            <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 transition-colors group-hover:border-blue-400/40">
                                <Gem className="size-5" />
                            </div>
                            <h3 className="text-sm font-semibold tracking-tight text-white">Verified Artisans</h3>
                            <p className="mt-1 text-xs leading-snug text-slate-400">Directory & certified representation</p>
                        </div>

                        <div className="group rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 xl:p-5 backdrop-blur-md transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80">
                            <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 transition-colors group-hover:border-indigo-400/40">
                                <Layers className="size-5" />
                            </div>
                            <h3 className="text-sm font-semibold tracking-tight text-white">Card Engine</h3>
                            <p className="mt-1 text-xs leading-snug text-slate-400">Mini-site cards & year archives</p>
                        </div>

                        <div className="group rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 xl:p-5 backdrop-blur-md transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80">
                            <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 transition-colors group-hover:border-emerald-400/40">
                                <ShieldCheck className="size-5" />
                            </div>
                            <h3 className="text-sm font-semibold tracking-tight text-white">Role Security</h3>
                            <p className="mt-1 text-xs leading-snug text-slate-400">Encrypted access & governance</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="relative z-10 flex items-center justify-between pt-6 border-t border-slate-800/60 text-xs font-medium text-slate-400">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        <span>System Operational • 100% Encrypted Connection</span>
                    </div>
                </div>
            </div>

            {/* ── Right Side: Light Login Card Section ── */}
            <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-[#F8FAFC] p-6 sm:p-10 lg:col-span-5 xl:col-span-5 relative">
                {/* Mobile Top Brand (shown on small screens only) */}
                <div className="mb-8 flex lg:hidden items-center gap-2">
                    <img
                        src={normalizeLogoSrc(settings?.logo)}
                        alt={systemName}
                        className="h-8 w-auto object-contain"
                        onError={(e) => {
                            e.currentTarget.src = '/logo.svg';
                        }}
                    />
                </div>

                {/* Floating Card */}
                <div className="w-full max-w-[430px] rounded-[28px] border border-slate-200/70 bg-white p-7 sm:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.03)] transition-all">
                    {/* Brand Logo in Card Header */}
                    <div className="flex justify-center mb-5">
                        <img
                            src={normalizeLogoSrc(settings?.logo)}
                            alt={systemName}
                            className="h-9 sm:h-10 w-auto max-w-[200px] object-contain"
                            onError={(e) => {
                                e.currentTarget.src = '/logo.svg';
                            }}
                        />
                    </div>

                    {/* Card Title & Subtitle */}
                    <div className="text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Admin Portal</h2>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500">
                            Welcome back! Please enter your credentials to continue.
                        </p>
                    </div>

                    {/* Status Alert */}
                    {status && (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-medium text-emerald-700">
                            {status}
                        </div>
                    )}

                    {/* Form */}
                    <form className="mt-7 flex flex-col gap-4" onSubmit={submit}>
                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                                EMAIL ADDRESS
                            </Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="admin@admin.com"
                                    className="h-11 sm:h-12 rounded-xl border-slate-200/90 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>
                            <InputError message={errors.email} className="text-xs text-red-500" />
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                                    PASSWORD
                                </Label>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                        tabIndex={5}
                                    >
                                        Forgot password?
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="h-11 sm:h-12 rounded-xl border-slate-200/90 bg-slate-50/80 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            <InputError message={errors.password} className="text-xs text-red-500" />
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center space-x-2.5 pt-0.5">
                            <Checkbox
                                id="remember"
                                checked={data.remember}
                                onCheckedChange={(checked) => setData('remember', checked === true)}
                                tabIndex={3}
                                className="size-4 rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <Label
                                htmlFor="remember"
                                className="cursor-pointer select-none text-sm font-medium text-slate-600"
                            >
                                Remember me
                            </Label>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            tabIndex={4}
                            disabled={processing}
                            className="mt-2 h-11 sm:h-12 w-full rounded-xl bg-blue-600 font-semibold text-sm text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-[0.99] flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In to Dashboard</span>
                                    <ArrowRight className="size-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Footer Copyright */}
                <div className="mt-8 text-center text-xs text-slate-400">
                    {copyrightText}
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye, EyeOff, Building2, Lock, Mail, KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'
import { Card, CardContent } from '@/components/ui/card'
import { StickerBadge } from '@/components/ui/sticker-badge'
import { authApi } from '@/lib/api'
import { authStorage } from '@/lib/auth-storage'
import { IMAGES, GIFS, STICKERS } from '@/lib/assets'

const loginSchema = z.object({
  tenantCode: z.string().min(1, 'Organization code is required'),
  identifier: z.string().min(1, 'Email, mobile or user ID is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

const features = [
  { emoji: STICKERS.secure, label: 'Multi-Tenant SaaS' },
  { emoji: '👥', label: 'Role-Based Access' },
  { emoji: STICKERS.chart, label: 'Real-Time WIP' },
  { emoji: STICKERS.fast, label: 'Audit Trail' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenantCode: 'DEMO-MOTORS',
      identifier: 'rajesh@demomotors.com',
      password: 'demo1234',
      rememberMe: true,
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setApiError(null)
    try {
      const result = await authApi.login(data)
      authStorage.setToken(result.accessToken)
      authStorage.setRefreshToken(result.refreshToken)
      authStorage.setUser({
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        tenant: result.user.tenant,
        branches: result.user.branches,
        defaultBranchId: result.user.defaultBranchId,
      })
      if (result.user.defaultBranchId) authStorage.setBranchId(result.user.defaultBranchId)
      navigate('/app/dashboard')
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Login failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={IMAGES.garageInterior} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-charcoal/95 via-brand-charcoal/85 to-brand-charcoal/70" />
        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <Logo variant="full" size="xl" to="/" />
          <h2 className="mt-10 text-3xl font-bold text-white leading-tight">
            One vehicle.<br />One service visit.<br />
            <span className="text-brand-yellow">One connected journey.</span>
          </h2>
          <p className="mt-6 text-white/60 leading-relaxed max-w-md">
            Manage bookings, job cards, workshop floor, spare parts, billing and customer
            relationships — all from one enterprise platform.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 max-w-sm">
            {features.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/10 hover:bg-white/15 transition-colors"
              >
                <span className="text-lg">{item.emoji}</span>
                <span className="text-sm text-white/80 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 flex gap-3 flex-wrap">
            <StickerBadge emoji={STICKERS.car} label="500+ Workshops" className="!bg-white/10 !text-white !border-white/20" />
            <StickerBadge emoji={STICKERS.star} label="4.9 Rating" className="!bg-white/10 !text-white !border-white/20" delay={300} />
          </div>
          <div className="absolute bottom-8 right-8 h-24 w-24 rounded-2xl overflow-hidden border-2 border-brand-yellow/30 shadow-2xl animate-wiggle">
            <img src={GIFS.wrenchSpin} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-brand-grey relative hero-pattern">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-yellow/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-brand-charcoal/5 rounded-full blur-3xl" />

        <div className="w-full max-w-md relative animate-slide-up">
          <div className="lg:hidden mb-8 flex justify-center"><Logo variant="full" size="lg" to="/" /></div>

          <Card className="shadow-2xl border-brand-border/60">
            <CardContent className="p-8">
              <div className="mb-6 text-center lg:text-left">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-yellow/15 mb-4 ring-4 ring-brand-yellow/10">
                  <Lock className="h-7 w-7 text-brand-charcoal" />
                </div>
                <h1 className="text-2xl font-bold text-brand-charcoal">Welcome back 👋</h1>
                <p className="text-sm text-brand-muted mt-1">Sign in to your ZENTROROX account</p>
              </div>

              {apiError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-brand-danger">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="relative">
                  <Building2 className="absolute left-3 top-[34px] h-4 w-4 text-brand-muted z-10" />
                  <Input label="Organization / Tenant Code" placeholder="e.g. DEMO-MOTORS" error={errors.tenantCode?.message} className="pl-10" {...register('tenantCode')} />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-[34px] h-4 w-4 text-brand-muted z-10" />
                  <Input label="Email / Mobile / User ID" placeholder="Enter your identifier" error={errors.identifier?.message} className="pl-10" {...register('identifier')} />
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-[34px] h-4 w-4 text-brand-muted z-10" />
                  <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" error={errors.password?.message} className="pl-10" {...register('password')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[34px] text-brand-muted hover:text-brand-text">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="rounded border-brand-border accent-brand-yellow" {...register('rememberMe')} />
                    Remember me
                  </label>
                  <a href="#" className="text-sm font-medium text-brand-charcoal hover:text-brand-yellow transition-colors">Forgot password?</a>
                </div>
                <Button type="submit" className="w-full shadow-md" size="lg" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-brand-charcoal/30 border-t-brand-charcoal rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : 'Sign In →'}
                </Button>
              </form>

              <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-brand-yellow/15 to-brand-yellow/5 border border-brand-yellow/25">
                <div className="flex items-start gap-3 text-xs text-brand-muted">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-yellow/25 text-lg">🔑</div>
                  <div>
                    <p className="font-semibold text-brand-charcoal text-sm mb-1">Demo Credentials</p>
                    <p><strong>Tenant:</strong> DEMO-MOTORS</p>
                    <p><strong>Email:</strong> rajesh@demomotors.com</p>
                    <p><strong>Password:</strong> demo1234</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-brand-muted mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/#contact" className="font-medium text-brand-charcoal hover:text-brand-yellow">Book a Demo</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

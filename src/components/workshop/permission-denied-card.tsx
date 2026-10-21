import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { authStorage } from '@/lib/auth-storage'

type Props = {
  title?: string
  message?: string
  requiredPermissions?: string[]
}

export function PermissionDeniedCard({
  title = 'Insufficient permissions',
  message,
  requiredPermissions,
}: Props) {
  const user = authStorage.getUser()
  return (
    <Card className="border-amber-200 bg-amber-50/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-amber-950">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-amber-950/90">
        <p>
          {message ??
            'Your role does not include access to this module. Ask a workshop manager to update role permissions, or sign in with a different account.'}
        </p>
        {user?.role && (
          <p>
            <span className="font-medium">Signed in as:</span> {user.firstName} {user.lastName ?? ''} ({user.role})
          </p>
        )}
        {requiredPermissions && requiredPermissions.length > 0 && (
          <p className="text-xs font-mono bg-white/60 rounded-md p-2 border border-amber-200/80">
            Needed: {requiredPermissions.join(', ')}
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="outline" asChild>
            <Link to="/app/dashboard">Back to dashboard</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/login">Sign in again</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

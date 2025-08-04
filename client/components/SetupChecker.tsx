import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { CheckCircle, XCircle, AlertTriangle, Database, Loader2 } from 'lucide-react'

interface SetupStatus {
  database: 'checking' | 'success' | 'error'
  table: 'checking' | 'success' | 'error'
  permissions: 'checking' | 'success' | 'error'
  data: 'checking' | 'success' | 'error'
}

export default function SetupChecker() {
  const [status, setStatus] = useState<SetupStatus>({
    database: 'checking',
    table: 'checking',
    permissions: 'checking',
    data: 'checking'
  })
  const [errors, setErrors] = useState<string[]>([])
  const [isRetrying, setIsRetrying] = useState(false)

  const checkSetup = async () => {
    setErrors([])
    setStatus({
      database: 'checking',
      table: 'checking',
      permissions: 'checking',
      data: 'checking'
    })

    try {
      // Test 1: Database connection
      const { error: connError } = await supabase.auth.getSession()
      if (connError) {
        setStatus(prev => ({ ...prev, database: 'error' }))
        setErrors(prev => [...prev, `Database connection failed: ${connError.message}`])
        return
      }
      setStatus(prev => ({ ...prev, database: 'success' }))

      // Test 2: Table exists
      const { data, error: tableError } = await supabase
        .from('submissions')
        .select('count', { count: 'exact' })
        .limit(0)

      if (tableError) {
        setStatus(prev => ({ ...prev, table: 'error' }))
        if (tableError.message.includes('relation "submissions" does not exist')) {
          setErrors(prev => [...prev, 'Table "submissions" does not exist. Please run the SQL setup script.'])
        } else {
          setErrors(prev => [...prev, `Table error: ${tableError.message}`])
        }
        return
      }
      setStatus(prev => ({ ...prev, table: 'success' }))

      // Test 3: Insert permissions
      const testSubmission = {
        team_id: '999',
        level: 1,
        password: 'test-' + Date.now(),
        difficulty_rating: 5
      }

      const { data: insertData, error: insertError } = await supabase
        .from('submissions')
        .insert(testSubmission)
        .select()

      if (insertError) {
        setStatus(prev => ({ ...prev, permissions: 'error' }))
        setErrors(prev => [...prev, `Insert permission error: ${insertError.message}`])
        return
      }
      setStatus(prev => ({ ...prev, permissions: 'success' }))

      // Clean up test data
      if (insertData?.[0]?.id) {
        await supabase.from('submissions').delete().eq('id', insertData[0].id)
      }

      // Test 4: Read existing data
      const { data: readData, error: readError } = await supabase
        .from('submissions')
        .select('*')
        .limit(5)

      if (readError) {
        setStatus(prev => ({ ...prev, data: 'error' }))
        setErrors(prev => [...prev, `Read error: ${readError.message}`])
        return
      }

      setStatus(prev => ({ ...prev, data: 'success' }))

    } catch (error: any) {
      setErrors(prev => [...prev, `Unexpected error: ${error.message}`])
    }
  }

  useEffect(() => {
    checkSetup()
  }, [])

  const retrySetup = async () => {
    setIsRetrying(true)
    await checkSetup()
    setIsRetrying(false)
  }

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'success': return <CheckCircle className="text-green-500" size={20} />
      case 'error': return <XCircle className="text-red-500" size={20} />
      case 'checking': return <Loader2 className="text-blue-500 animate-spin" size={20} />
      default: return <AlertTriangle className="text-yellow-500" size={20} />
    }
  }

  const allGood = Object.values(status).every(s => s === 'success')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={24} />
            Database Setup Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Database Connection</span>
              {getStatusIcon(status.database)}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Submissions Table</span>
              {getStatusIcon(status.table)}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Insert Permissions</span>
              {getStatusIcon(status.permissions)}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Data Access</span>
              {getStatusIcon(status.data)}
            </div>
          </div>

          <Button onClick={retrySetup} disabled={isRetrying} className="w-full">
            {isRetrying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              'Retry Setup Check'
            )}
          </Button>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Setup Issues Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {allGood && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ✅ All checks passed! Your database is properly configured.
          </AlertDescription>
        </Alert>
      )}

      {!allGood && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Fix Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>1. Go to your Supabase dashboard:</strong></p>
              <p className="font-mono text-xs bg-muted p-2 rounded">https://supabase.com/dashboard</p>
              
              <p><strong>2. Open SQL Editor and run this script:</strong></p>
              <div className="font-mono text-xs bg-muted p-2 rounded whitespace-pre-wrap">
{`-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
    id BIGSERIAL PRIMARY KEY,
    team_id VARCHAR(10) NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 10),
    password TEXT NOT NULL,
    difficulty_rating INTEGER NOT NULL CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable read access for all users" ON public.submissions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.submissions
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.submissions TO anon;
GRANT ALL ON public.submissions TO authenticated;
GRANT USAGE ON SEQUENCE public.submissions_id_seq TO anon;
GRANT USAGE ON SEQUENCE public.submissions_id_seq TO authenticated;`}
              </div>
              
              <p><strong>3. Click "Run" and then retry the setup check above.</strong></p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

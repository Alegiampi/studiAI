import { createClient } from '@supabase/supabase-js'
import SharedExplanation from './SharedExplanation'

export default async function SharedPage({ params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('shared_explanations')
    .select('question, explanation, scuola, classe, created_at')
    .eq('id', params.id)
    .single()

  if (!data) return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: '#888', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 16, color: '#E0E0E0' }}>Spiegazione non trovata</div>
      </div>
    </div>
  )

  return <SharedExplanation data={data} id={params.id} />
}

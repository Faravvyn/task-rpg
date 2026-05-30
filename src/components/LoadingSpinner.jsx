import { Loader2 } from 'lucide-react'
export default function LoadingSpinner({ text = 'Laden...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
      <p className="text-gray-400 font-body">{text}</p>
    </div>
  )
}
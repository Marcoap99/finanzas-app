export default function Loading() {
  return (
    <div className="px-4 pt-5 pb-24 animate-pulse">
      <div className="h-6 w-40 bg-gray-200 rounded-xl mb-1" />
      <div className="h-4 w-28 bg-gray-100 rounded-xl mb-4" />
      <div className="h-20 bg-gray-200 rounded-2xl mb-4" />
      {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-200 rounded-2xl mb-2" />)}
    </div>
  )
}

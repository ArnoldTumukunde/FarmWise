const orgs = ['MAAIF', 'NAADS', "Heifer Int'l", 'SNV Uganda', 'FAO Uganda'];

export function TrustedByFarmersBar() {
  return (
    <div className="bg-[#f0f7f0] border-t border-b border-gray-200 py-4 px-4 md:px-6 lg:px-10">
      <div className="max-w-[1340px] mx-auto flex items-center gap-6 flex-wrap">
        <span className="text-sm font-medium text-text-muted flex-shrink-0">
          Trusted by extension workers at:
        </span>
        {orgs.map(org => (
          <span key={org} className="text-sm font-bold text-text-muted opacity-60 flex-shrink-0">
            {org}
          </span>
        ))}
      </div>
    </div>
  );
}

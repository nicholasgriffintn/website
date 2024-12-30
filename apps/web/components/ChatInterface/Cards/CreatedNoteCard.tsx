export function CreatedNoteCard({ data }: any) {
	if (!data) return null;

	return (
		<div className="bg-black-50 rounded-lg">
			<h3 className="text-lg font-semibold mb-3">Created Note</h3>
			<div className="space-y-3">
				<div key={data.id} className="p-3 bg-black rounded border">
					{data.title && <h4 className="text-white-700 mb-2">{data.title}</h4>}
					{data.content && (
						<p className="text-white-700 mb-2">{data.content}</p>
					)}
					<div className="text-sm text-white-500">
						<span>ID: {data.id}</span>
					</div>
				</div>
			</div>
		</div>
	);
}

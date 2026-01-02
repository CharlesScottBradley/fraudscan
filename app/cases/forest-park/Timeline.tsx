'use client';

interface Entity {
  entity_name: string;
  entity_type: string;
  conviction_date?: string;
  plea_date?: string;
  sentence_date?: string;
  sentence?: string;
}

interface TimelineProps {
  entities: Entity[];
}

interface TimelineEvent {
  date: string;
  sortKey: number;
  name: string;
  type: 'plea' | 'conviction' | 'sentence';
  sentence?: string;
}

function parseDateToSortKey(dateStr: string): number {
  const months: Record<string, number> = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4,
    'May': 5, 'June': 6, 'July': 7, 'August': 8,
    'September': 9, 'October': 10, 'November': 11, 'December': 12
  };

  for (const [month, num] of Object.entries(months)) {
    if (dateStr.includes(month)) {
      const yearMatch = dateStr.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : 2019;
      return year * 100 + num;
    }
  }
  return 0;
}

export default function Timeline({ entities }: TimelineProps) {
  // Build timeline events
  const events: TimelineEvent[] = [];

  entities.forEach(entity => {
    if (entity.plea_date) {
      events.push({
        date: entity.plea_date,
        sortKey: parseDateToSortKey(entity.plea_date),
        name: entity.entity_name,
        type: 'plea',
        sentence: entity.sentence,
      });
    }
    if (entity.conviction_date && entity.conviction_date !== entity.plea_date) {
      events.push({
        date: entity.conviction_date,
        sortKey: parseDateToSortKey(entity.conviction_date),
        name: entity.entity_name,
        type: 'conviction',
        sentence: entity.sentence,
      });
    }
    if (entity.sentence_date && entity.sentence_date !== entity.conviction_date && entity.sentence_date !== entity.plea_date) {
      events.push({
        date: entity.sentence_date,
        sortKey: parseDateToSortKey(entity.sentence_date),
        name: entity.entity_name,
        type: 'sentence',
        sentence: entity.sentence,
      });
    }
  });

  // Sort by date
  events.sort((a, b) => a.sortKey - b.sortKey);

  // Group by date
  const groupedEvents: Record<string, TimelineEvent[]> = {};
  events.forEach(event => {
    if (!groupedEvents[event.date]) {
      groupedEvents[event.date] = [];
    }
    groupedEvents[event.date].push(event);
  });

  const sortedDates = Object.keys(groupedEvents).sort((a, b) =>
    parseDateToSortKey(a) - parseDateToSortKey(b)
  );

  if (sortedDates.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-800" />

      <div className="space-y-6">
        {sortedDates.map((date, idx) => (
          <div key={idx} className="relative pl-10">
            {/* Dot */}
            <div className="absolute left-2.5 w-3 h-3 rounded-full bg-gray-700 border-2 border-gray-600" />

            {/* Date */}
            <p className="text-gray-500 text-sm font-mono mb-2">{date}</p>

            {/* Events on this date */}
            <div className="space-y-2">
              {groupedEvents[date].map((event, eventIdx) => (
                <div key={eventIdx} className="flex items-start gap-3">
                  <span className="text-gray-600 text-xs uppercase w-16 shrink-0">
                    {event.type === 'plea' && 'Plea'}
                    {event.type === 'conviction' && 'Convicted'}
                    {event.type === 'sentence' && 'Sentenced'}
                  </span>
                  <div>
                    <p className="text-gray-300 text-sm">{event.name}</p>
                    {event.sentence && event.type !== 'plea' && (
                      <p className="text-gray-500 text-xs">{event.sentence}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import ds from 'dawnseekers';

export default function update(state) {
  const { world } = state;
  const seekers = (world?.tiles || []).flatMap((t) => t.seekers);
  const countSeekers = seekers.length;

  const values = (world?.buildings || [])
  .flatMap((building) => building.kind?.name?.value)
  .filter((value) => value !== null && value !== undefined);


    const frequencies = {};
    values.forEach((value) => {
    if (frequencies[value]) {
        frequencies[value] += 1;
    } else {
        frequencies[value] = 1;
    }
    });

    const chartData = Object.entries(frequencies).map(([value, frequency]) => `${frequency}`).join(',');

    const chartLabels = Object.keys(frequencies).join('|');

    const chartURL = `https://chart.googleapis.com/chart?chs=250x100&chd=t:${chartData}&cht=p&chf=bg,s,ffffff00&chl=${chartLabels}`;

  return {
    version: 1,
    components: [
      {
        id: 'my-hello-plugin',
        type: 'building',
        title: 'Analytics Hut',
        summary: 'Pick your stat!',
        content: [
          {
            id: 'default',
            type: 'popout',
            buttons: [
              {
                text: 'Building Split',
                type: 'toggle',
                content: 'pie',
              },
              {
                text: 'Total Engineers',
                type: 'toggle',
                content: 'engineercount',
              },
            ],
          },
          {
            id: 'pie',
            type: 'popout',
            html: `<img src="${chartURL}" />`,
          },
          {
            id: 'engineercount',
            type: 'popout',
            html: `Total Engineers: ${countSeekers}`,
          },
        ],
      },
    ],
  };
}

import ds from 'dawnseekers';

export default function update(state) {
  const { world } = state;
  const seekers = (world?.tiles || []).flatMap((t) => t.seekers);
  const countSeekers = seekers.length;
  let displayIndex = 0;
  
//   const toggleDisplay = () => {
//     displayIndex = (displayIndex + 1) % 2; 
//   };

//   function getDisplayText(displayIndex) {
//     switch (displayIndex) {
//       case 0:
//         return 'Show Engineer Count';
//       case 1:
//         return 'Show Pie Chart';
//       default:
//         return '';
//     }
//   }
  
//   function getDisplayHTML(displayIndex) {
//     switch (displayIndex) {
//       case 0:
//         return `Total Engineers: ${countSeekers}`;
//       case 1:
//         return `<img src="https://chart.googleapis.com/chart?chs=250x100&chd=t:60,40&cht=p3&chf=bg,s,ffffff00&chl=Hello%7CWorld" />`;
//       default:
//         return '';
//     }
//   }

  return {
    version: 1,
    components: [
      {
        id: 'my-hello-plugin',
        type: 'building',
        title: 'Analytics Hut',
        summary: 'Click to see the total number of Engineers in the world',
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
            html: `<img src="https://chart.googleapis.com/chart?chs=250x100&chd=t:60,40&cht=p3&chf=bg,s,ffffff00&chl=Hello%7CWorld" />`,
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

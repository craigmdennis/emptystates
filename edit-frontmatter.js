const editor = require('front-matter-editor');
const glob = require('glob');
const extend = require('util')._extend;
const path = require('path');
const Fs = require('fs');

const filePath = path.join('./content/states/**/*.md');
const destPath = path.join('./test/');

// if add author property to front-matter
glob(filePath, function (er, files) {
  console.log('Error:', er);

  files.forEach((file) => {
    const pathname = file.split('/');
    const destFolder = `${pathname[0]}/${pathname[1]}/${pathname[2]}/`;

    console.log(destFolder);

    const { birthtime } = Fs.statSync(file);
    editor
      .read(file)
      .data((data, matter) => {
        if (matter.data.date) return;

        matter.data = extend(data, { date: '1970-01-01T00:00:00.000Z' });
        matter.data = extend(data, {
          title: matter.data.image
            .replace('./', '')
            .replace('.png', '')
            .replace('.jpg', ''),
        });
        matter.data = extend(data, { tags: ['mobile'] });
      })
      .save(destFolder, { prefix: '' }, function (err, data) {
        if (err) {
          console.log('Could not write:', err);
        }
      });
  });
});

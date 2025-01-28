global.CustomEvent = class CustomEvent extends Event {
  constructor(event, params) {
    super(event, params);
    this.detail = params?.detail || null;
  }
};

const IpfsModel = require("../models/ipfsModel.js");
const { TextEncoder, TextDecoder } = require('util');


const write = async (req, res) => {
  const { name, content } = req.body;
  const { createHelia } = await import('helia')
  const { unixfs } = await import('@helia/unixfs');
  const { MemoryBlockstore } = await import('blockstore-core/memory');

  // the blockstore is where we store the blocks that make up files. this blockstore
  // stores everything in-memory - other blockstores are available:
  //   - https://www.npmjs.com/package/blockstore-fs - a filesystem blockstore (for use in node)
  const blockstore = new MemoryBlockstore()

  // create a Helia node
  const helia = await createHelia({
    blockstore
  })

  // create a filesystem on top of Helia, in this case it's UnixFS
  const fs = unixfs(helia)

  // we will use this TextEncoder to turn strings into Uint8Arrays
  const encoder = new TextEncoder()

  // add the bytes to your node and receive a unique content identifier
  const cid = await fs.addBytes(encoder.encode(content))

  // add doc to db
  const contentInDb = await IpfsModel.findOne({ cid: cid.toString() }).select({'_id': 0});
  if (contentInDb) {
    return res.status(200).json(contentInDb);
  } else {
    const ipfsSaved = await IpfsModel.create({ cid: cid.toString(), name });
    res.status(200).json(ipfsSaved);
  }
};

// CHECK / VALIDATE
// https://explore.ipld.io/#/explore/bafkreihq3jkz5jm45vuljvsxjfv65f2tybch24dqfly2guohk5zcnwlxem
const read = async (req, res) => {
  const { name } = req.params;

  const { createHelia } = await import('helia')
  const { unixfs } = await import('@helia/unixfs');
  const { MemoryBlockstore } = await import('blockstore-core/memory');

  const contentInDb = await IpfsModel.findOne({ name });
  if (contentInDb) {
    const cid = contentInDb.cid;
    const blockstore = new MemoryBlockstore()

    // // create a Helia node
    const helia = await createHelia({
      blockstore
    })

    // create a filesystem on top of Helia, in this case it's UnixFS
    const fs = unixfs(helia)

    const decoder = new TextDecoder()

    // read the file from the blockstore using the Helia node
    let text = '';
    for await (const chunk of fs.cat(cid)) {
      text += decoder.decode(chunk, {
        stream: true
      })
    }

    return res.json({ name, cid, content: text });
  } else {
    return res.status(404).json({ error: 'File not found by the given name' });
  }
};


module.exports = { read, write };

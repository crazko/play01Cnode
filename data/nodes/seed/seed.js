const { spawn } = require('child_process');
module.exports = function(RED) {
    function SeedNode(config) {
        RED.nodes.createNode(this,config);
        this.length = config.length;
        let node = this;
        node.on('input', function(msg, send, done, err) {
          if(!Number.isInteger(parseInt(node.length))) {
              let err =`Length property for node ${node.type}:${node.id} is not configured properly, look at help for valid inputs!`;
              node.error(err);
              return;
          }
          const seed = spawn('bx', ['seed', '-b', node.length]);
          seed.stdout.on('data', data => {
            msg.payload = `${data}`.trim();
          });
          seed.stderr.on('data', err => {
            if (done) {
              done(err.toString());
            }
            else {
              node.error(err.toString(), msg);
            }
          });
          seed.on('close', code => {
              if (code === 0) {
                node.send(msg);
                if (done) { //bakwards compatibility
                  done();
                }
              }
              else {
                if (done) {
                  done(`bx exited with: ${code}`);
                }
                else {
                  node.error(`bx exited with: ${code}`, msg);
                }
              }
          });
        });
    }
    RED.nodes.registerType("seed",SeedNode);
    RED.httpAdmin.post("/seed/:id", RED.auth.needsPermission("seed.write"), function(req,res) {
     let node = RED.nodes.getNode(req.params.id);
     if (node != null) {
       try {
         node.receive();
         res.sendStatus(200);
       } catch(err) {
         res.sendStatus(500);
         node.error(RED._("seed.failed",{error:err.toString()}));
       }
     } else {
       res.sendStatus(404);
     }
   });
}

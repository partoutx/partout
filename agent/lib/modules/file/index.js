/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2016 Graham Lee Bevan <graham.bevan@ntlworld.com>

    This file is part of Partout.

    Partout is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*jslint node: true, nomen: true, vars: true*/
/*global p2 */
'use strict';

var console = require('better-console'),
    u = require('util'),
    P2M = require('../../p2m'),
    _ = require('lodash'),
    os = require('os'),
    fs = require('fs'),
    utils = new (require('../../utils'))(),
    pfs = new (require('../../pfs'))(),
    Mustache = require('mustache'),
    Q = require('q');

/**
 * @module File
 *
 * @description
 * File module
 * ===========
 *
 *     p2.node([...])
 *       .file('file or title', options, function (err, stdout, stderr) { ... });
 *
 * Options:
 *
 *   | Operand     | Type    | Description                            |
 *   |:------------|---------|:---------------------------------------|
 *   | path        | String  | File path, overrides title             |
 *   | ensure      | String  | Present, absent, file, directory, link |
 *   | content     | String  | Content of file, can be object containing {file: 'filaname'} or {template: 'template file'} |
 *   | is_template | Boolean | Content is a template                  |
 *   | mode        | String  | Octal file mode                        |
 *   | owner       | String  | Owner of this file object              |
 *   | group       | String  | Group owner of this file object        |
 *   | watch       | Boolean | Watch this file object for changes and reapply policy |
 *
 *   Templates use the [Mustache](https://www.npmjs.com/package/mustache) templating library.
 *
 * ---
 * also supports:
 *
 * Watches for real-time reapplication of policy when a file object is changed
 *
 *     .watch(true)
 *     .file('your_file_to_watch', {ensure: 'file', content: 'template_file'})
 *     .watch(false)
 *     ...
 *
 * ---
 * TODO: remaining support
 *  Owner, Group
 *
 */

var File = P2M.Module(function () {
  var self = this;

  /*
   * module definition using P2M DSL
   */

  self

  ////////////////////
  // Name this module
  .name('file')

  ////////////////
  // Gather facts
  .facts(function (deferred, facts_so_far) {
    var facts = {
      file_loaded: true
    };
    deferred.resolve(facts);
  })

  //////////////////
  // Action handler
  .action(function (args) {
    //console.log('File action args:', args);

    // TODO: Fix use of Sync methods

    var deferred = args.deferred,
        inWatchFlag = args.inWatchFlag,
        _impl = args._impl,
        title = args.title,
        opts = args.opts,
        cb = args.cb; // cb is policy provided optional call back on completion

    var file = title,
      msg,
      record = '';

    if (opts.path) {
      file = opts.path;
    }

    var _watch_state = (opts.watch ? true : _impl._watch_state);

    fs.lstat(file, function (err, stats) {
      var fd,
        mode_prefix = '';

      if (err) {
        console.error('err:', err);
      } else {
        console.log('stats:', stats);
      }

      if (opts.ensure) {
        switch (opts.ensure) {
        case 'present':
        case 'file':
          mode_prefix = '100';

          if (err && err.code === 'ENOENT') {
            console.warn('Creating file', file);

            // Unwatch and force new watcher
            _impl.P2_unwatch(file);
            inWatchFlag = false;

            fd = fs.openSync(file, 'w');
            fs.closeSync(fd);
            record += 'Created file. ';
            console.log('record:', record);
          }
          //console.log('**** content:', typeof(opts.content));
          if (opts.content !== undefined) {
            record += self._ensure_content(file, opts.content, opts.is_template);
          }
          break;

        case 'absent':
          if (!err && stats) {
            if (stats.isDirectory()) {
              console.warn('Deleting directory', file);
              fs.rmdirSync(file);
              record += 'Deleted directory. ';
            } else {
              console.warn('Deleting file', file);
              fs.unlinkSync(file);
              record += 'Deleted file. ';
            }
          }
          deferred.resolve({
            module: 'file',
            object: file,
            msg: record
          });
          return; // no need to watch, so return now

        case 'directory':
          mode_prefix = '040';

          if (err && err.code === 'ENOENT') {
            console.warn('Creating directory', file);
            fs.mkdirSync(file);
            record += 'Created directory. ';
          } else if (!stats.isDirectory()) {
            console.error('Error:', file, 'exists and is not a directory');
          }
          break;

        case 'link':
          mode_prefix = '120';

          if (!opts.target) {
            msg = 'Error: Link ' + file + ' requested but no target specified';
            console.error(msg);
            throw (new Error(msg));
          }
          if (err && err.code === 'ENOENT') {
            console.warn('Creating link', file);
            fs.symlinkSync(opts.target, file, 'file');
            record += 'Created link. ';
          } else if (err) {
            throw (err);

          } else if (!stats.isDirectory()) {
            console.error('Error:', file, 'exists and is not a link');
          }
          break;

        default:
          msg = 'Error: ensure ' + opts.ensure + ' is not supported';
          console.error(msg);
          throw (new Error(msg));
        }
      } // if ensure

      stats = fs.lstatSync(file);

      if (opts.mode && typeof(opts.mode) === 'string') {
        if (opts.mode.match(/^0[0-9]{3}$/)) {
          var m = parseInt(mode_prefix + opts.mode.slice(1), 8); // as octal
          if (m !== stats.mode) {
            console.log('File: mode', stats.mode.toString(8), 'should be', m.toString(8));
            fs.chmodSync(file, m);
            record += 'Changed mode from ' + stats.mode.toString(8) + ' to ' + m.toString(8) + '. ';
          }
        }
      }

      if (!inWatchFlag && _watch_state && GLOBAL.p2_agent_opts.daemon) {
        console.log('>>> Starting watcher on file:', file);
        _impl.P2_watch(file, function (next_event_cb) {
          console.log('watcher triggered. file:', file, 'this:', this);
          var watch_action_deferred = Q.defer();

          //self.action (cb, true);
          (self.getActionFn()) ({
            deferred: watch_action_deferred,
            inWatchFlag: true,
            _impl: _impl,
            title: title,
            opts: opts,
            cb: function () {}  // dummy cb
          });

          watch_action_deferred.promise
          .then(function (o) {
            console.log('file watch o:', o);
            _impl.sendevent(o);
            next_event_cb();
          })
          .done();

        });
      }

      // pass updated status to caller (p2 steps) with optional event data
      var o = undefined;
      if (record && record !== '') {
        o = {
          module: 'file',
          object: file,
          msg: record
        };
      }
      deferred.resolve(o);

    }); // fs.stat



  }) // .action ()
  ;

});

/**
 * ensure contents match
 * @param {String} file file name
 * @param {String} data file content (can be a template)
 * @param {Boolean} is_template is this a template
 */
File.prototype._ensure_content = function (file, data, is_template) {
  var self = this,
      f_hash = pfs.hashFileSync(file),
      record = '';

  //console.log('_ensure_content file:', file, ' data:', data);

  if (typeof(data) === 'object') {
    if (data.file) {
      return self._ensure_file(file, data.file, is_template);

    } else if (data.template) {
      return self._ensure_file(file, data.template, true);
    }
  }

  if (is_template) {
    //console.log('+++ template: p2.facts:', p2.facts, 'p2:', p2, 'self:', self, 'self.facts:', self.facts);
    data = Mustache.render(data, p2.facts);
  }

  var d_hash = pfs.hash(data);
  console.log('File: comparing file hash:', f_hash, '-> content hash:', d_hash);
  if (f_hash != d_hash) {
    //console.warn('File: updating file content:\n' + data);
    fs.writeFileSync(file, data);
    record += 'Content Replaced. ';
  }

  return record;
};

/**
 * ensure file matches
 * @param {String} file file name
 * @param {String} srcfile source file (can be a template)
 * @param {Boolean} is_template is this a template
 */
File.prototype._ensure_file = function (file, srcfile, is_template) {
  var self = this;
  console.log('_ensure_file(' + file + ',', srcfile + ')');
  var data = fs.readFileSync(srcfile).toString();
  console.log('data:', data);
  return self._ensure_content(file, data, is_template);
};

module.exports = File;

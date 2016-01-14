/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015-2016  Graham Lee Bevan <graham.bevan@ntlworld.com>

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

/*jslint node: true, nomen: true */
'use strict';

var console = require('better-console'),
  _ = require('lodash'),
  os = require('os'),
  fs = require('fs'),
  exec = require('child_process').exec,
  Q = require('q');

Q.longStackSupport = true;

var Package = function () {

};

/**
 * @description
 * Package module
 * ==============
 *
 *    p2.package(
 *      'title or pkg name',
 *      options,
 *      function (err, stdout, stderr) {
 *        ... to be called after exec of pkg command ...
 *      }
 *    )
 *
 * Options:
 *   | Operand    | Type    | Description                                                |
 *   |:-----------|---------|:-----------------------------------------------------------|
 *   | name       | String  | Package name to install (defaults to title) |
 *   | ensure     | String  | present/installed, absent/purged, latest (default is present) |
 *
 */

Package.runAction = function (next_step_callback, title, opts, command_complete_cb) {
  var self = this;  // self is _impl
  //console.log('package action self:', self);
  //console.log('package action called next_step_callback:', next_step_callback);

  // fix env for non-interactive apt commands
  process.env.DEBIAN_FRONTEND = "noninteractive";

  // PRESENT / INSTALLED / LATEST
  if (opts.ensure.match(/^(present|installed|latest)$/)) {
    console.log('ensure present');

    if (!self.facts.installed_packages[opts.name]) {

      exec('apt-get update && apt-get install -y ' + opts.name, function (err, stdout, stderr) {
        if (err) {
          console.error('apt-get install failed:', err, stderr);
        } else {
          self.facts.installed_packages[opts.name] = {};  // next facts run will populate
        }
        if (command_complete_cb) command_complete_cb(err, stdout, stderr);
        next_step_callback({
          module: 'package',
          object: opts.name,
          msg: 'install ' + (err ? err : 'ok')
        });
      });

    } else if (opts.ensure === 'latest') {
      // LATEST
      // TODO: check if newer version available for update.
      exec('apt-get update && apt-get upgrade -y ' + opts.name, function (err, stdout, stderr) {
        if (err) {
          console.error('apt-get upgrade failed:', err, stderr);
        }
        if (command_complete_cb) command_complete_cb(err, stdout, stderr);
        next_step_callback({
          module: 'package',
          object: opts.name,
          msg: 'upgrade ' + (err ? err : 'ok')
        });
      });
    }

  } else if (opts.ensure.match(/^(absent|purged)$/)) {
    // ABSENT / PURGED
    console.log('ensure absent pkg inst:', self.facts.installed_packages[opts.name]);

    if (self.facts.installed_packages[opts.name]) {

      console.log('ensure absent on debian');
      exec('apt-get purge -y ' + opts.name, function (err, stdout, stderr) {
        if (err) {
          console.error('apt-get purge failed:', err, stderr);
        } else {
          delete self.facts.installed_packages[opts.name];
        }
        if (command_complete_cb) command_complete_cb(err, stdout, stderr);
        next_step_callback({
          module: 'package',
          object: opts.name,
          msg: 'uninstall ' + (err ? err : 'ok')
        });
      });

    } else {
      console.error('Unsupported option for package ensure:', opts.ensure);
      next_step_callback();
    }

  } else {
    console.error('package module does not support ensure option value of:', opts.ensure);
    next_step_callback();
  }
};

Package.getFacts = function (facts_so_far) {
  var self = this,
    facts = {},
    packages = {},
    deferred = Q.defer(),
    cmd = '';
  //console.log('facts_so_far:', facts_so_far);

  // get installed packages for this OS

  // Debian-like OS's
  exec('dpkg -l | tail -n +6', function (err, stdout, stderr) {
    if (err) {
      console.log('exec of dpkg -l failed:', err, stderr);
      deferred.resolve({});
    } else {
      //console.log('stdout:', stdout);
      var lines = stdout.split(/\r?\n/);
      _.forEach(lines, function (line) {
        line = line.trim();
        if (line === '') {
          return;
        }
        var fields = line.split(/\s+/, 4);
        //console.log('fields:', fields);
        var p_obj = {
          name: fields[1],
          version: fields[2],
          arch: fields[3]
        };
        //facts['package:' + fields[1]] = p_obj;
        packages[fields[1]] = p_obj;
      });
      facts.installed_packages = packages;

      deferred.resolve(facts);
    }
  });

  return deferred.promise;
};

module.exports = Package;

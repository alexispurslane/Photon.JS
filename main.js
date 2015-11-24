function Photon(obj) {
    'use strict';
    if (typeof obj === 'string') {
        obj = { token: obj };
    }

    if (obj.debug) console.debug(obj);

    var self = {
        settings: {
            debug: obj.debug || false,
            save: function (k, v) {
                var s = v || this[k];
                this[k] = v;

                return s;
            },

            token: obj.token || '',
            authorized: obj.authorized || false,
            version: obj.version || 1,
            name: obj.name || '',
            id: obj.id || 0,

            url: function () {
                if (this.token === '') throw new Error("Undefined token.");
                var args = Array.prototype.slice.call(arguments);
                args.forEach(function (e) {
                    if (e === '' || e === 0 || e === undefined || e === null) {
                        throw new Error("Undefined or invalid section in path.");
                    }
                });
                var url = this.baseUrl + '/' + (args.join('/')) + '?access_token=' + this.token;

                if (this.debug) console.debug(url);

                return url;
            }
        },

        auth: {
            authorize: function (tok) {
                this.settings.token = tok;
                if (this.settings.debug) console.debug(tok);
                return this;
            },

            list: function () {
                return $.get(this.settings.url('access_tokens'));
            },

            delete: function (tok) {
                return $.ajax({
                    url: this.settings.url('access_tokens', tok),
                    type: 'delete'
                });
            }
        },

        devices: {
            list: function () {
                return $.get(this.settings.url('devices'));
            },

            getInfo: function (id) {
                this.settings.save('id', id);
                if (this.settings.debug) console.debug(id);
                
                return $.get(this.settings.url('devices', id));
            },

            makeClaimCode: function (id) {
                this.settings.save('id', id);
                if (this.settings.debug) console.debug(id);
                
                return $.post(this.settings.url('device_claims'), {});
            },

            get: function (id, v) {
                this.settings.save('id', id);
                if (this.settings.debug) console.debug(id);
                
                return $.get(this.settings.url('devices', id, v));
            },

            claim: function (id) {
                this.settings.save('id', id);
                if (this.settings.debug) console.debug(id);
                
                return $.post(this.settings.url('devices'), {});
            },

            call: function (id, name, arg) {
                this.settings.save('id', id);
                this.settings.save('name', name);
                if (this.settings.debug) console.debug(id);
                if (this.settings.debug) console.debug(name);
                
                return $.post(this.settings.url('devices', id, name), { arg: arg });
            }
        },

        events: {
            getStream: function (prefix) {
                if (prefix) {
                    if (this.settings.debug) console.debug(prefix);
                    return $.get(this.settings.url('events', prefix));
                } else {
                    return $.get(this.settings.url('events'));
                }
            },

            getDevicesStream: function (prefix) {
                if (prefix) {
                    if (this.settings.debug) console.debug(prefix);
                    return $.get(this.settings.url('devices', 'events', prefix));
                } else {
                    return $.get(this.settings.url('devices', 'events'));
                }
            },

            getDeviceStream: function (id, prefix) {
                this.settings.save('id', id);
                
                if (prefix) {
                    return $.get(this.settings.url('devices', id, 'events', prefix));
                } else {
                    return $.get(this.settings.url('devices', id, 'events'));
                }
            },

            publish: function (name, data, p, ttl) {
                this.settings.save('name', name);
                if (this.settings.debug) console.debug(name);
                
                data = data || {};
                p = p || false;

                if (!data) throw new Error("You must provide data to send.");

                if (ttl) {
                    if (this.settings.debug) console.debug({ data: data,
                                                             p: p,
                                                             ttl: ttl });
                    return $.post(this.setttings.url('devices', 'events'),
                                  { data: data,
                                    p: p,
                                    ttl: ttl });
                } else {
                    if (this.settings.debug) console.debug({ data: data,
                                                             p: p });

                    return $.post(this.setttings.url('devices', 'events'),
                                  { data: data,
                                    p: p });
                }
            }
        },

        firmware: {
            update: function (id) {
                this.settings.save('id', id);
                if (this.settings.debug) console.debug(id);
                
                return $.ajax({
                    url: this.settings.url('devices', id),
                    type: 'put'
                });
            },

            rename: function (id, name) {
                this.settings.save('id', id);
                this.settings.save('name', name);
                
                if (this.settings.debug) console.debug(id);
                if (this.settings.debug) console.debug(name);
                
                return $.ajax({
                    url: this.settings.url('devices', id),
                    data: { name: name },
                    type: 'put'
                });
            },

            flashSourceCode: function (id, file) {
                var boundary = "---------------------------7da24f2e50046";
                var body = '--' + boundary + '\r\n'
                    + 'Content-Disposition: form-data; name="file";'
                    + 'filename="code.cpp"\r\n'
                    + 'Content-type: plain/text\r\n\r\n'
                    + data + '\r\n'
                    + '--'+ boundary + '--';
                if (this.settings.debug) console.debug(body);
                if (this.settings.debug) console.debug(id);

                if (!id) throw new Error("An id is necessary for flashing source code. The Flash was not successful.");
                if (!file) throw new Error("You need code to flash code to a device. The Flash was not successful.");
                
                return $.ajax({
                    url: this.settings.url('devices', id),
                    contentType: "multipart/form-data; boundary=" + boundary,
                    data: { file: body },
                    type: 'put'
                });
            }
        },

        orgs: {
            list: function () {
                return $.get(this.settings.url('orgs')); // orcs?
            },

            get: function (slug) {
                if (this.settings.debug) console.debug(slug);
                return $.get(this.settings.url('orgs', slug)); // Orcs like slugs!
            },

            removeTeamMember: function (slug, username) {
                this.settings.save('slug', slug);
                if (this.settings.debug) console.debug(slug);
                if (this.settings.debug) console.debug(username);
                
                return $.ajax({
                    type: 'delete',
                    url: this.settings.url('orgs', slug, 'users', username)
                });
            },    
        },

        products: {
            get: function (slug, pSlug) {
                if (this.settings.debug) console.debug(slug);
                if (this.settings.debug) console.debug(pSlug);
                
                return $.get(this.settings.url('orgs', slug, 'products', pSlug));
            },

            genClaimCode: function (slug, pSlug) {
                if (this.settings.debug) console.debug(slug);
                if (this.settings.debug) console.debug(pSlug);
                
                return $.post(this.settings.url('orgs', slug, 'products', pSlug, 'device_claims'));
            },

            removeDevice: function (slug, pSlug, id) {
                if (this.settings.debug) console.debug(slug);
                if (this.settings.debug) console.debug(pSlug);
                if (this.settings.debug) console.debug(id);
                
                return $.ajax({
                    type: 'delete',
                    url: this.settings.url('orgs', slug, 'products', pSlug, 'devices', id)
                });
            }
        }
    };
    
    self.auth.settings = Photon.settings;
    self.devices.settings = Photon.settings;
    self.firmware.settings = Photon.settings;
    self.products.settings = Photon.settings;
    self.orgs.settings = Photon.settings;
    self.settings.baseUrl = 'https://api.particle.io/v' + self.settings.version;
    if (obj.debug) console.debug(self.settings.baseUrl);

    return self;
}


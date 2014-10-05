'use strict';

var app = require('angular').module('kontApp');

app.controller('LoginController', require('./login'));
app.controller('PageEditController', require('./pageedit'));
app.controller('PageTreeController', require('./pagetree'));
app.controller('PrerenderController', require('./prerender'));
app.controller('SideNavController', require('./sidenav'));
app.controller('SiteAddController', require('./siteadd'));
app.controller('SiteDetailController', require('./sitedetail'));
app.controller('SiteListController', require('./sitelist'));
app.controller('SitemapController', require('./sitemap'));
app.controller('UserAddNewController', require('./useradd'));
app.controller('UserAuthTokenController', require('./userauthtoken'));
app.controller('UserCredController', require('./usercred'));
app.controller('UserCredPasswordController', require('./usercredpassword'));
app.controller('UserDetailController', require('./userdetail'));
app.controller('UserListController', require('./userlist'));

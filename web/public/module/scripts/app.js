Ext.Loader.setConfig({enabled: true});
Ext.Loader.setPath('IVR', '/javascripts/app');
Ext.onReady(function() {
    Ext.tip.QuickTipManager.init();
    Ext.create('Ext.container.Viewport', {
        renderTo: Ext.getBody(),
        layout: 'fit',
        items:
	        Ext.create('Ext.Panel', {
			    title: lang.user + ': <b>' + window['_username'] + '</b>',
			    items: Ext.create('IVR.view.scripts.Editor', {})
			})
   })
});
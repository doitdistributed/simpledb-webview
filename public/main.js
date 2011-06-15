$(function(){       

  // ****************************************************************
  // Credentials
  // ****************************************************************
  
  //
  // Credentials Model
  //
  Credentials = Backbone.Model.extend({
    
    initialize: function(){
      _.bindAll(this, 'save', 'fetch', 'isBad');
      this.fetch();
    },
    
    defaults: {
      keyid: '',
      secret: ''
    },
    
    // not using validate() as it is too pedantic for our purposes (called on both set() and save())
    isBad: function(){
      var attr = this.attributes;
      if (attr.keyid.length===0 || attr.secret.length===0) {
        return "Empty Key ID/Secret";
      }
    },
    
    fetch: function(){
      if ($.cookie('aws-credentials')) {
        var creds = JSON.parse($.cookie('aws-credentials'));
        this.set(creds);
      }
    },
    
    save: function(){
      if (!this.isBad()) {
        $.cookie('aws-credentials', JSON.stringify(this.toJSON()), {path:"/", expires:30}); // expires in 1 month
      }
    }
        
  });
  credentials = new Credentials();
  
  //
  // Credentials View
  //
  CredentialsView = Backbone.View.extend({

    el: $('.credentials'),
    
    events: {
      "blur input": 'updateModel'
    },

    initialize: function(){
      _.bindAll(this, 'render', 'updateModel', 'showError');
      this.model.bind('change', this.render);
      this.render();
    },

    render: function(){
      this.$('input#keyid').val( this.model.get('keyid') );
      this.$('input#secret').val( this.model.get('secret') );
    },

    updateModel: function(){
      this.model.set({
        keyid: $.trim( this.$('input#keyid').val() ),
        secret: $.trim( this.$('input#secret').val() )
      }, {
        error: this.render // ensures view is in sync with model even if model doesn't validate
      });
    },
    
    showError: function(){
      alert('Error with credentials: ' + this.model.isBad());
    }
    
  });
  
  credentialsView = new CredentialsView({
    model: credentials
  });


  // ****************************************************************
  // Domains  
  // ****************************************************************

  //
  // Domain Model
  //
  Domain = Backbone.Model.extend({
    defaults: {
      name: '',
      count: 0
    }
  });
  
  domain = new Domain();

  //
  // Domains Collection
  //
  Domains = Backbone.Collection.extend({
    model: Domain
  });
  
  domains = new Domains();

  //
  // Domains View
  //
  DomainsView = Backbone.View.extend({

    el: $('#domains .contents'),

    initialize: function(){
      _.bindAll(this, 'render');
      this.collection.bind('change', this.render);
      this.render();
    },

    render: function(){
      var self = this;
      self.el.html('');
      this.collection.each(function(domain){
        var $obj = $('<div class="domain"> <div class="db-icon"><img src="img/db.png"></img></div> <div class="domain-name-wrapper"><span class="domain-name"></span> <span class="count"></span></div> </div>');
        $obj.find(".domain-name").html(domain.get('name'));
        $obj.find('.count').html('('+domain.get('count')+')');
        $obj.appendTo(self.el);
      });
    }

  });

  domainsView = new DomainsView({
    collection: domains
  });


  // ****************************************************************
  // App  
  // ****************************************************************
  
  //
  // App View
  //
  App = Backbone.View.extend({
    
    el: $('body'),
    
    events: {
      'click button#view': 'showDomains'
    },
    
    initialize: function(){
      _.bindAll(this, 'render');
      this.render();
    },  
    
    render: function(){
      // layout
      $(this.el).layout({ 
        applyDefaultStyles: true,
        spacing_open: 4,
        north__spacing_open: 0,
        north__size: 50,
        north__resizable: false,
        north__closable: false,
        west__minSize: 250
      });
  
      // buttons
      this.$('button').button();
  
      // about dialog
      this.$('#about-dialog').dialog({
        autoOpen: false,
        width: 400,
        title: 'About',
        modal: true,
        buttons: {
          Ok: function() {
            $(this).dialog('close');
          }
        }   
      }); // about dialog  
    }, // render
    
    showDomains: function(){
      if (credentials.isBad()) {
        credentialsView.showError();
      }
      else {
        credentials.save();
        domains.add({name:'asdf', count:11});
        // $.cookie('aws-credentials', JSON.stringify(credentials.toJSON()), {path:"/", expires:30}); // expires in 1 month
        // $('.ui-layout-west .contents').html('');
        // $('.ui-layout-center .contents').html('');
        // getDomains();
      }
    }
      
  });
  
  app = new App();

  
/*
  
  // Cookie management
  if ($.cookie('aws-credentials')) {
    var creds = JSON.parse($.cookie('aws-credentials'));
    $('input#keyid').val(creds.keyid);
    $('input#secret').val(creds.secret);
  }
  
  // getDomains()
  function getDomains(callback) {          
    $('.ui-layout-west .loading-icon').show();
    $.get('/get.domains', getCredentialsInput(), function(data){
      $(data).each(function(index, domain){
        var $obj = $('<div class="domain"> <div class="db-icon"><img src="img/db.png"></img></div> <div class="domain-name-wrapper"><span class="domain-name"></span> <span class="count"></span></div> </div>');
        $obj.find(".domain-name").html(domain.name);
        $obj.appendTo('.ui-layout-west .contents');
        $obj.find('.count').html('('+domain.count+')');
      });
    }, 'json')
    .error(function(){
      alert('Error getting data from server');
    })
    .complete(function(){
      $('.ui-layout-west .loading-icon').hide();            
    });
  }
  
  // encodeHtml()
  function encodeHtml(str){
    return $('<div/>').text(str).html();
  }
        
  // displayTable()
  function displayTable($theTable){
    var numFields = $theTable.find('thead th').size();
    var colRatioVector = [];
    for (var i=0;i<numFields;i++){
      colRatioVector.push(200);
    }
    var $origTableParent = $theTable.parent(); // prior to the wrappers due to fixheadertable()
    $theTable.fixheadertable({
      zebra: true,
      zebraClass: 'table-zebra',
      height: 200,          
      wrapper: false,
      colratio: colRatioVector,
      resizeCol: true,
      sortable: true
    });
  
    fitTable($theTable, $origTableParent);
    $(window).resize(function(){
      clearTimeout(window.resizeTimer);
      window.resizeTimer = setTimeout(function(){ // hack to ensure the event is only fired *after* resizing motion            
        fitTable($theTable, $origTableParent);                        
      }, 500);
    });
    
    function fitTable($tableObj, $parentObj) {
      var $tableBody = $tableObj.parents('.body');
      $tableBody.height( $parentObj.height() - $tableBody.siblings('.headtable').height() - 2); // see DOM after $.fixheadertable()
    }
  }
  
  // displayData()
  function displayData(data){          
    // build fieldNames from heterogeneous data
    var fieldNames = [];
    data.forEach(function(datum){ // loop over each row
      for (key in datum) {
        if (fieldNames.indexOf(key)<0)
          fieldNames.push(key);
      }
    });
    fieldNames.sort();
  
    // build table head
    var $table = $('<table cellpadding="0" cellspacing="0" border="0" class="display" id="the-table"></table>');
    var $tHead = $('<thead></thead>').appendTo($table);
    var templateStr = '';
    fieldNames.forEach(function(field){
      $('<th></th>').html(field).appendTo($tHead);
      templateStr += '<td>${'+encodeHtml(field)+'}</td>';
    });
  
    // build table body
    var $tBody = $('<tbody></tbody>').appendTo($table);
    templateStr = '<tr>'+templateStr+'</tr>';
    $.template('dataTemplate', templateStr);
    $.tmpl('dataTemplate', data).appendTo($tBody);
    
    $table.appendTo('.ui-layout-center .contents');
    displayTable($table);
  }
  
  // getItems()
  function getItems($obj){
    $('.ui-layout-center .contents').html('');
    $('.ui-layout-center .loading-icon').show();
    var domainName = $obj.find('.domain-name').html();
    var theData = getCredentialsInput();
    theData.domain = domainName;
    $.get('/get.items', theData, function(data){
      $('.ui-layout-center .loading-icon').hide();
      displayData(data);
    }, 'json');
  }
  
  // click: view domains button
  $('button#view').click(function(){          
    if (getCredentialsInput().keyid.length>0 && getCredentialsInput().secret.length>0) {
      $.cookie('aws-credentials', JSON.stringify(getCredentialsInput()), {path:"/", expires:30}); // expires in 1 month
      $('.ui-layout-west .contents').html('');
      $('.ui-layout-center .contents').html('');
      getDomains();
    }
    else {
      alert('Please enter your AWS key ID and secret.');
    }
  });
  
  // click: domain pane
  $('.domain').live('click', function(e){
    $('.domain.selected').removeClass('selected');
    $(this).addClass('selected');          
    
    getItems($(this));
  });
  
  // click: about button
  $('button#about').click(function(){
    $('#about-dialog').dialog('open');
  });
  
  // click: domain contents
  $('table tr').live('click', function(e){
    $(this).siblings('.selected').removeClass('selected');
    $(this).addClass('selected');
  });

*/

});

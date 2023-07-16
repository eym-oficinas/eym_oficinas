odoo.define('equino_trading.form_handler', function (require) {
    "use strict";

    var Class = require('web.Class');

    var OpportunityKanban = Class.extend({

        init: function () {          
            this.expand();
        },

        expand: function () {
            const self = this;        
            $("button.o_column_unfold").click();
            $("div.o_kanban_load_more button.btn-outline-primary").click();
        },


    });

    var opportunity_kanban = new OpportunityKanban();

    setInterval(function () {
        if ($('.o_opportunity_kanban').length > 0) {

            opportunity_kanban.expand();

        }
        if ($('.o_calendar_view .fc-limited').length > 0) {
            console.log('**********')
            
            $(".fc-limited").attr('class','');
        }
        if ($('.fc-more-cell').length > 0) {
            $('.fc-more-cell').each(function () { 
                  $(this).closest('tr').remove();
            });
        }

        
    });
    
});
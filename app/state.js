(() => {
  'use strict';
  const RC = window.RootcashApp;
  const C = RC.config;
  const D = window.RootcashDomain;
  const STORAGE_KEY = 'rootcash:v1';
  const blankAllocations = () => Object.fromEntries(C.categories.map(c => [c.name, 0]));
  const normalizeAllocations = (raw={}) => Object.fromEntries(C.categories.map(c => [c.name, Number(raw?.[c.name] || 0)]));
  const emptyState = () => ({schemaVersion:1,transactions:[],plan:{month:C.nextMonthKey,incomes:[],expenses:[],allocations:blankAllocations()},settings:{safetyRate:10}});

  function defaultState(){
    const tx=[
      {id:C.uid('tx'),type:'income',label:'Lương & thu nhập',amount:27500000,date:C.dateInMonth(C.currentMonthKey,9),category:'Thu nhập'},
      {id:C.uid('tx'),type:'expense',label:'Ăn uống',amount:4200000,date:C.dateInMonth(C.currentMonthKey,7),category:'Ăn uống'},
      {id:C.uid('tx'),type:'expense',label:'Mua sắm',amount:3100000,date:C.dateInMonth(C.currentMonthKey,10),category:'Mua sắm'},
      {id:C.uid('tx'),type:'expense',label:'Thể thao',amount:1200000,date:C.dateInMonth(C.currentMonthKey,12),category:'Thể thao'},
      {id:C.uid('tx'),type:'expense',label:'Yêu đương',amount:2500000,date:C.dateInMonth(C.currentMonthKey,14),category:'Yêu đương'},
      {id:C.uid('tx'),type:'expense',label:'Dịch vụ nhà',amount:5800000,date:C.dateInMonth(C.currentMonthKey,18),category:'Dịch vụ nhà'},
    ];
    const incomes=[
      {id:C.uid('pin'),label:'Lương chính',amount:20000000,date:C.dateInMonth(C.nextMonthKey,9)},
      {id:C.uid('pin'),label:'Thưởng/ngoài',amount:4000000,date:C.dateInMonth(C.nextMonthKey,15)},
      {id:C.uid('pin'),label:'Thu khác',amount:5000000,date:C.dateInMonth(C.nextMonthKey,24)},
    ];
    const expenses=[
      {id:C.uid('pout'),label:'Tiền nhà',amount:5500000,date:C.dateInMonth(C.nextMonthKey,3),category:'Dịch vụ nhà'},
      {id:C.uid('pout'),label:'Thẻ tín dụng',amount:4800000,date:C.dateInMonth(C.nextMonthKey,8),category:'Mua sắm'},
      {id:C.uid('pout'),label:'Sinh hoạt cố định',amount:6300000,date:C.dateInMonth(C.nextMonthKey,10),category:'Ăn uống'},
      {id:C.uid('pout'),label:'Xăng xe',amount:2000000,date:C.dateInMonth(C.nextMonthKey,12),category:'Xăng xe'},
    ];
    return {schemaVersion:1,transactions:tx,plan:{month:C.nextMonthKey,incomes,expenses,allocations:{'Yêu đương':1500000,'Ăn uống':2500000,'Thể thao':800000,'Xăng xe':1000000,'Dịch vụ nhà':1000000,'Mua sắm':1200000,'AI và học tập':800000,'Trading':800000,'Invest':800000}},settings:{safetyRate:10}};
  }
  function migrate(raw){
    if(!raw || typeof raw!=='object') return defaultState();
    raw.schemaVersion ||= 1;
    raw.transactions = Array.isArray(raw.transactions) ? raw.transactions : [];
    raw.transactions = raw.transactions.map(tx => tx?.type==='expense' && !C.categoryNames.has(tx.category) ? {...tx,category:'Dịch vụ nhà'} : tx);
    raw.plan ||= {month:C.nextMonthKey,incomes:[],expenses:[],allocations:{}};
    raw.plan.month ||= C.nextMonthKey;
    raw.plan.incomes = Array.isArray(raw.plan.incomes) ? raw.plan.incomes : [];
    raw.plan.expenses = Array.isArray(raw.plan.expenses) ? raw.plan.expenses : [];
    raw.plan.expenses = raw.plan.expenses.map(item => C.categoryNames.has(item?.category) ? item : {...item,category:'Dịch vụ nhà'});
    raw.plan.allocations = normalizeAllocations(raw.plan.allocations);
    raw.settings = {safetyRate:10,...(raw.settings||{})};
    return raw;
  }
  function load(){try{const raw=localStorage.getItem(STORAGE_KEY); return raw?migrate(JSON.parse(raw)):defaultState();}catch{return defaultState();}}
  RC.store = {
    state: load(),
    save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(this.state));},
    replace(next){this.state=next; this.save();},
    emptyState, defaultState, migrate,
    summary(){return D.monthSummary(this.state.transactions,C.currentMonthKey);},
    planning(){return D.calculateBuffer(this.state.plan.incomes,this.state.plan.expenses,this.state.settings.safetyRate);},
  };
})();

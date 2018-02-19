import { observable, action, computed, autorunAsync } from 'mobx';
import { getTimeUnit } from './utils';

export default class TimeperiodStore {
    constructor(mainStore) {
        this.mainStore = mainStore;
        autorunAsync(this.onContextReady.bind(this));
    }

    get context() { return this.mainStore.chart.context; }

    @observable open = false;
    @observable timeUnit = null;
    @observable interval = null;

    @action.bound setOpen(val) {
        this.open = val;
    }

    onContextReady() {
        if(this.context) {
            const { timeUnit, interval } = this.context.stx.layout;
            this.timeUnit = getTimeUnit({ timeUnit, interval });
            this.interval = interval;
        }
    }

    @action.bound setPeriodicity(interval, timeUnit) {
        if (this.context.loader) {
            this.context.loader.show();
        }

        const stx = this.context.stx;
        stx.setPeriodicity({ period: 1, interval, timeUnit }, () => {
            const isTick = timeUnit === 'second';
            const isCandle = ~['candle', 'hollow_condle', 'colored_bar'].indexOf(stx.layout.chartType);
            if (this.context.loader) {
                this.context.loader.hide();
            }
            if (isCandle && isTick) {
                stx.setChartType('mountain');
            } else if (!isTick && !isCandle) {
                stx.setChartType('candle');
            }

            this.mainStore.chart.saveLayout();
        });

        this.timeUnit = getTimeUnit(stx.layout);
        this.interval = stx.layout.interval;
        this.open = false;
    }

    @computed get interval_display() {
        if (this.interval % 60 === 0) {
            return this.interval / 60;
        }
        return +this.interval ? this.interval : 1;
    }
}
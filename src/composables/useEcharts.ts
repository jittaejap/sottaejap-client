import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  MarkPointComponent,
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  MarkPointComponent,
])

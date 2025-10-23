import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import EnergyCalendar from '@/components/EnergyCalendar';
import EnergyStats from '@/components/EnergyStats';
import EnergyTrends from '@/components/EnergyTrends';
import AddEntryDialog from '@/components/AddEntryDialog';
import { useEnergyData } from '@/hooks/useEnergyData';

const Index = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [timePeriod, setTimePeriod] = useState<'all' | '3days' | 'week' | 'month' | 'year'>('all');
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
  const { data, isLoading, error, refetch } = useEnergyData();

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refetch]);

  const getColorClass = (score: number) => {
    if (score >= 5) return 'energy-excellent';
    if (score >= 4) return 'energy-good';
    if (score >= 3) return 'energy-neutral';
    if (score >= 2) return 'energy-medium-low';
    return 'energy-low';
  };

  const parseDate = (dateStr: string): Date => {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  };

  const getFilteredStats = () => {
    if (!data?.entries) return { good: 0, neutral: 0, bad: 0, average: 0, total: 0 };
    
    console.log('All entries:', data.entries.map(e => ({ date: e.date, score: e.score })));
    
    let filtered = data.entries;
    
    if (timePeriod !== 'all') {
      const now = new Date();
      const todayMs = Date.now();
      
      let daysBack: number;
      
      switch (timePeriod) {
        case '3days':
          daysBack = 3;
          break;
        case 'week':
          daysBack = 7;
          break;
        case 'month':
          daysBack = 30;
          break;
        case 'year':
          daysBack = 365;
          break;
        default:
          daysBack = 0;
      }
      
      const cutoffMs = todayMs - (daysBack * 24 * 60 * 60 * 1000);
      
      filtered = data.entries.filter(e => {
        const entryMs = parseDate(e.date).getTime();
        const isInRange = entryMs >= cutoffMs;
        console.log('Entry:', e.date, 'parsed:', parseDate(e.date), 'ms:', entryMs, 'cutoff:', cutoffMs, 'inRange:', isInRange);
        return isInRange;
      });
      
      console.log('Filtered entries:', filtered.length, 'from', data.entries.length);
    }
    
    const good = filtered.filter(e => e.score >= 4).length;
    const neutral = filtered.filter(e => e.score === 3).length;
    const bad = filtered.filter(e => e.score <= 2).length;
    const total = filtered.length;
    const average = total > 0 ? filtered.reduce((sum, e) => sum + e.score, 0) / total : 0;
    
    return { good, neutral, bad, average, total };
  };

  const stats = getFilteredStats();
  const recentEntries = data?.entries?.slice(-3).reverse() || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <header className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <Icon name="Zap" size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">KatFlow</h1>
                <p className="text-sm text-muted-foreground">Выгорание? Не сегодня</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => refetch()}
                size="lg"
                variant="outline"
                className="flex-1 sm:flex-initial"
              >
                <Icon name="RefreshCw" size={20} className="mr-2" />
                Обновить
              </Button>
              <Button 
                onClick={() => setShowAddDialog(true)}
                size="lg"
                className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
              >
                <Icon name="Plus" size={20} className="mr-2" />
                Добавить запись
              </Button>
            </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-card shadow-md p-1 h-auto sm:h-14">
            <TabsTrigger 
              value="home" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 text-xs sm:text-sm"
            >
              <Icon name="Home" size={18} className="sm:mr-0" />
              <span className="hidden sm:inline">Главная</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stats"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 text-xs sm:text-sm"
            >
              <Icon name="BarChart3" size={18} className="sm:mr-0" />
              <span className="hidden sm:inline">Статистика</span>
            </TabsTrigger>
            <TabsTrigger 
              value="trends"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 text-xs sm:text-sm"
            >
              <Icon name="Activity" size={18} className="sm:mr-0" />
              <span className="hidden sm:inline">Тренды</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="animate-fade-in">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Icon name="Loader2" size={32} className="animate-spin text-primary" />
              </div>
            )}

            {error && (
              <Card className="shadow-lg border-l-4 border-l-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Icon name="AlertCircle" size={24} className="text-destructive" />
                    <div>
                      <p className="font-medium">Не удалось загрузить данные</p>
                      <p className="text-sm text-muted-foreground mt-1">Проверь, что Google таблица доступна по ссылке</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isLoading && !error && (
              <>
                <div className="mb-6 flex flex-wrap gap-2 justify-center">
                  <Button
                    variant={timePeriod === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimePeriod('all')}
                    className={timePeriod === 'all' ? 'bg-primary' : ''}
                  >Всё время</Button>
                  <Button
                    variant={timePeriod === '3days' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimePeriod('3days')}
                    className={timePeriod === '3days' ? 'bg-primary' : ''}
                  >
                    Последние 3 дня
                  </Button>
                  <Button
                    variant={timePeriod === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimePeriod('week')}
                    className={timePeriod === 'week' ? 'bg-primary' : ''}
                  >
                    Эта неделя
                  </Button>
                  <Button
                    variant={timePeriod === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimePeriod('month')}
                    className={timePeriod === 'month' ? 'bg-primary' : ''}
                  >
                    Этот месяц
                  </Button>
                  <Button
                    variant={timePeriod === 'year' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimePeriod('year')}
                    className={timePeriod === 'year' ? 'bg-primary' : ''}
                  >
                    Этот год
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <Card className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-energy-excellent">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span className="text-2xl">😊</span>
                          Хорошие дни
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-heading font-bold text-energy-excellent">{stats.good}</div>
                        <p className="text-sm text-muted-foreground mt-1">Всего записей</p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-energy-neutral">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span className="text-2xl">😐</span>
                          Нейтральные
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-heading font-bold text-energy-neutral">{stats.neutral}</div>
                        <p className="text-sm text-muted-foreground mt-1">Всего записей</p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-energy-low">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span className="text-2xl">😔</span>
                          Плохие дни
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-heading font-bold text-energy-low">{stats.bad}</div>
                        <p className="text-sm text-muted-foreground mt-1">Всего записей</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="shadow-lg relative overflow-hidden">
                    <CardContent className="p-8 h-full flex items-center justify-center">
                      <div className="relative w-48 h-96">
                        <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-lg">
                          <defs>
                            <clipPath id="wine-glass">
                              <path d="M 35 20 L 30 65 Q 30 85 50 85 Q 70 85 70 65 L 65 20 M 48 85 L 48 160 M 35 160 Q 35 165 40 165 L 60 165 Q 65 165 65 160" />
                            </clipPath>
                            <linearGradient id="wine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#8B0000" stopOpacity="1" />
                              <stop offset="50%" stopColor="#A00000" stopOpacity="1" />
                              <stop offset="100%" stopColor="#8B0000" stopOpacity="1" />
                            </linearGradient>
                            <radialGradient id="glass-shine">
                              <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="white" stopOpacity="0" />
                            </radialGradient>
                          </defs>
                          
                          <path 
                            d="M 35 20 L 30 65 Q 30 85 50 85 Q 70 85 70 65 L 65 20 Z"
                            fill="white"
                            fillOpacity="0.05"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="text-foreground/30"
                          />
                          
                          <line x1="48" y1="85" x2="48" y2="160" stroke="currentColor" strokeWidth="1.5" className="text-foreground/30" />
                          
                          <path 
                            d="M 35 160 Q 35 165 40 165 L 60 165 Q 65 165 65 160 L 60 160 L 40 160 Z"
                            fill="currentColor"
                            fillOpacity="0.1"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="text-foreground/30"
                          />
                          
                          <g clipPath="url(#wine-glass)">
                            <rect
                              x="30"
                              y={85 - (stats.total > 0 ? (stats.good / stats.total) * 65 : 0)}
                              width="40"
                              height={(stats.total > 0 ? (stats.good / stats.total) * 65 : 0)}
                              fill="url(#wine-gradient)"
                              className="transition-all duration-1000 ease-out"
                            />
                            
                            <ellipse
                              cx="50"
                              cy={85 - (stats.total > 0 ? (stats.good / stats.total) * 65 : 0)}
                              rx="18"
                              ry="3"
                              className="fill-red-900/60"
                              style={{
                                animation: 'sway 3s ease-in-out infinite'
                              }}
                            >
                              <animate
                                attributeName="ry"
                                values="3;4;3"
                                dur="3s"
                                repeatCount="indefinite"
                              />
                            </ellipse>
                            
                            <ellipse
                              cx="50"
                              cy={85 - (stats.total > 0 ? (stats.good / stats.total) * 65 : 0) + 1}
                              rx="16"
                              ry="2.5"
                              className="fill-red-700/40"
                              style={{
                                animation: 'sway 2.5s ease-in-out infinite reverse'
                              }}
                            >
                              <animate
                                attributeName="rx"
                                values="16;17;16"
                                dur="2.5s"
                                repeatCount="indefinite"
                              />
                            </ellipse>
                          </g>
                          
                          <ellipse
                            cx="42"
                            cy="35"
                            rx="8"
                            ry="15"
                            fill="url(#glass-shine)"
                            opacity="0.4"
                          />
                        </svg>
                        
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center w-full">
                          <p className="text-2xl font-heading font-bold text-primary">
                            {stats.total > 0 ? Math.round((stats.good / stats.total) * 100) : 0}%
                          </p>
                          <p className="text-xs text-muted-foreground">хороших дней</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {!isLoading && !error && (
              <Card className="shadow-lg mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Calendar" size={20} />
                    Последние записи
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentEntries.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Пока нет записей</p>
                  ) : (
                    <div className="space-y-3">
                      {recentEntries.map((entry, idx) => {
                        const colorClass = getColorClass(entry.score);
                        const isExpanded = expandedEntry === idx;
                        return (
                          <div 
                            key={idx}
                            onClick={() => setExpandedEntry(isExpanded ? null : idx)}
                            className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-${colorClass}/10 to-transparent border-l-4 border-l-${colorClass} hover:shadow-md transition-all cursor-pointer`}
                          >
                            <div className={`min-w-[3rem] w-12 h-12 rounded-xl bg-${colorClass} flex items-center justify-center text-white font-heading font-bold text-xl shadow-md`}>
                              {entry.score}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{entry.date}</p>
                              <p className={`text-sm text-muted-foreground ${isExpanded ? '' : 'line-clamp-1'}`}>{entry.thoughts}</p>
                            </div>
                            <Icon 
                              name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                              size={20} 
                              className="text-muted-foreground flex-shrink-0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!isLoading && !error && (
              <EnergyCalendar data={data} isLoading={isLoading} />
            )}
          </TabsContent>

          <TabsContent value="stats" className="animate-fade-in">
            <EnergyStats data={data} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="trends" className="animate-fade-in">
            <EnergyTrends data={data} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>

      <AddEntryDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
};

export default Index;
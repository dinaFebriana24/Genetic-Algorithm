from flask import Flask, request, jsonify
from flask_cors import CORS
import random
from deap import base, creator, tools, algorithms
import math
import time

app = Flask(__name__)
CORS(app)

class WisataRouteOptimizer:
    def __init__(self):
        # Daftar lokasi wisata
        self.locations = [
            'Malioboro',
            'Taman Sari',
            'Alun-Alun Kidul Jogja',
            'Pasar Prawirotaman',
            'Kaliurang - Jeep Tour',
            'Candi Prambanan',
            'Goa Pindul',
            'Pantai Parangtritis',
            'Pantai Glagah',
            'Pedestrian Tugu dan Margo Utomo'
        ]

        # Matrix jarak (dalam km)
        self.distance_matrix = [
            [0, 2.5, 2.5, 3.6, 25, 17, 42, 28, 41, 21],
            [2.5, 0, 0.7, 2.9, 27, 19, 42, 27, 41, 20],
            [2.5, 0.7, 0, 2.3, 27, 21, 42, 27, 41, 20],
            [3.6, 2.9, 2.3, 0, 28, 25, 41, 26, 46, 11],
            [25, 27, 27, 28, 0, 24, 59, 53, 66, 52],
            [17, 19, 21, 25, 24, 0, 37, 43, 58, 20],
            [42, 42, 42, 41, 59, 37, 0, 48, 76, 47],
            [28, 27, 27, 26, 53, 43, 48, 0, 38, 34],
            [41, 41, 41, 46, 66, 58, 76, 38, 0, 40],
            [21, 20, 20, 11, 52, 20, 47, 34, 40, 0]
        ]

        # Matrix waktu (dalam menit)
        self.time_matrix = [
            [0, 7, 7, 8, 39, 27, 66, 42, 57, 33],
            [9, 0, 3, 8, 45, 32, 70, 47, 63, 35],
            [8, 3, 0, 6, 53, 37, 72, 46, 63, 36],
            [9, 9, 7, 0, 54, 33, 66, 42, 64, 23],
            [42, 47, 56, 56, 0, 39, 89, 87, 102, 78],
            [26, 32, 39, 39, 40, 0, 64, 67, 86, 40],
            [64, 65, 70, 69, 99, 60, 0, 72, 112, 80],
            [42, 47, 43, 40, 87, 66, 69, 0, 54, 54],
            [63, 66, 66, 61, 100, 94, 110, 53, 0, 62],
            [35, 37, 19, 21, 84, 41, 82, 55, 61, 0]
        ]

         # Bobot optimasi (tetap sesuai permintaan)
        self.weights = {
            'time': 0.40,  # 40% - Waktu perjalanan
            'distance': 0.30,  # 30% - Jarak
        }

        # Kombinasi metode
        self.method_combinations = [
            {'selection': 'tournament', 'mutation': 'swap', 'name': 'Tournament + Swap'},
            {'selection': 'tournament', 'mutation': 'inversion', 'name': 'Tournament + Inversion'},
            {'selection': 'tournament', 'mutation': 'scramble', 'name': 'Tournament + Scramble'},
            {'selection': 'roulette', 'mutation': 'swap', 'name': 'Roulette + Swap'},
            {'selection': 'roulette', 'mutation': 'inversion', 'name': 'Roulette + Inversion'},
            {'selection': 'roulette', 'mutation': 'scramble', 'name': 'Roulette + Scramble'},
            {'selection': 'rank', 'mutation': 'swap', 'name': 'Rank + Swap'},
            {'selection': 'rank', 'mutation': 'inversion', 'name': 'Rank + Inversion'},
            {'selection': 'rank', 'mutation': 'scramble', 'name': 'Rank + Scramble'}
        ]

        # Setup DEAP
        self.setup_deap()

        # Storage untuk hasil eksperimen
        self.experiment_results = {}

    def setup_deap(self):
        """Setup DEAP framework untuk genetic algorithm"""
        # Hapus jika sudah ada
        if hasattr(creator, "FitnessMax"):
            del creator.FitnessMax
        if hasattr(creator, "Individual"):
            del creator.Individual

        # Create fitness class (maximize fitness)
        creator.create("FitnessMax", base.Fitness, weights=(1.0,))
        creator.create("Individual", list, fitness=creator.FitnessMax)

        # Initialize toolbox
        self.toolbox = base.Toolbox()

    def get_location_index(self, location):
        return self.locations.index(location)

    def calculate_total_distance(self, route):
        total_distance = 0
        for i in range(len(route) - 1):
            from_index = self.get_location_index(route[i])
            to_index = self.get_location_index(route[i + 1])
            total_distance += self.distance_matrix[from_index][to_index]
        return total_distance

    def calculate_total_time(self, route):
        total_time = 0
        for i in range(len(route) - 1):
            from_index = self.get_location_index(route[i])
            to_index = self.get_location_index(route[i + 1])
            total_time += self.time_matrix[from_index][to_index]
        return total_time

    def calculate_fitness(self, route):
        total_distance = self.calculate_total_distance(route)
        total_time = self.calculate_total_time(route)
        
        # Normalisasi dan bobot
        distance_weight = 0.6
        time_weight = 0.4
        
        # Normalisasi dengan nilai maksimum yang mungkin
        max_distance = 360
        max_time = 588
        
        normalized_distance = total_distance / max_distance
        normalized_time = total_time / max_time
        
        # Gabungkan dengan bobot
        combined_score = (
            self.weights['time'] * normalized_time +
            self.weights['distance'] * normalized_distance 
        )

        # Return inverse untuk fitness
        return 1 / combined_score

    def tournament_selection(self, population, tournament_size=3):
        tournament = random.sample(population, min(tournament_size, len(population)))
        return max(tournament, key=self.calculate_fitness)

    def roulette_wheel_selection(self, population):
        fitness_values = [self.calculate_fitness(individual) for individual in population]
        total_fitness = sum(fitness_values)
        
        if total_fitness == 0:
            return random.choice(population)
        
        random_value = random.uniform(0, total_fitness)
        cumulative_fitness = 0
        
        for i, individual in enumerate(population):
            cumulative_fitness += fitness_values[i]
            if cumulative_fitness >= random_value:
                return individual
        
        return population[-1]

    def rank_selection(self, population):
        sorted_population = sorted(population, key=self.calculate_fitness, reverse=True)
        total_ranks = len(population) * (len(population) + 1) // 2
        random_value = random.uniform(0, total_ranks)
        
        cumulative_rank = 0
        for i, individual in enumerate(sorted_population):
            cumulative_rank += (len(population) - i)
            if cumulative_rank >= random_value:
                return individual
        
        return sorted_population[-1]

    def swap_mutation(self, route):
        if len(route) < 3:
            return route[:]
        
        mutated = route[:]
        i = random.randint(1, len(mutated) - 1)
        j = random.randint(1, len(mutated) - 1)
        mutated[i], mutated[j] = mutated[j], mutated[i]
        return mutated

    def inversion_mutation(self, route):
        if len(route) < 4:
            return route[:]
        
        mutated = route[:]
        start = random.randint(1, len(mutated) - 3)
        end = random.randint(start + 1, len(mutated) - 1)
        
        mutated[start:end + 1] = reversed(mutated[start:end + 1])
        return mutated

    def scramble_mutation(self, route):
        if len(route) < 4:
            return route[:]
        
        mutated = route[:]
        start = random.randint(1, len(mutated) - 3)
        end = random.randint(start + 1, len(mutated) - 1)
        
        segment = mutated[start:end + 1]
        random.shuffle(segment)
        mutated[start:end + 1] = segment
        return mutated

    def genetic_algorithm(self, start_location, selection_type, mutation_type):
        other_locations = [loc for loc in self.locations if loc != start_location]
        population_size = 50
        generations = 100
        mutation_rate = 0.1

        # Inisialisasi populasi
        population = []
        for _ in range(population_size):
            shuffled = other_locations[:]
            random.shuffle(shuffled)
            population.append([start_location] + shuffled)

        # Evolusi
        for gen in range(generations):
            new_population = []
            
            # Elitism
            sorted_pop = sorted(population, key=self.calculate_fitness, reverse=True)
            new_population.append(sorted_pop[0])

            # Generate populasi baru
            while len(new_population) < population_size:
                # Seleksi parent
                if selection_type == 'tournament':
                    parent1 = self.tournament_selection(population)
                    parent2 = self.tournament_selection(population)
                elif selection_type == 'roulette':
                    parent1 = self.roulette_wheel_selection(population)
                    parent2 = self.roulette_wheel_selection(population)
                elif selection_type == 'rank':
                    parent1 = self.rank_selection(population)
                    parent2 = self.rank_selection(population)

                # Crossover
                crossover_point = len(parent1) // 2
                child = parent1[:crossover_point][:]
                
                for loc in parent2:
                    if loc not in child:
                        child.append(loc)

                # Mutasi
                if random.random() < mutation_rate:
                    if mutation_type == 'swap':
                        child = self.swap_mutation(child)
                    elif mutation_type == 'inversion':
                        child = self.inversion_mutation(child)
                    elif mutation_type == 'scramble':
                        child = self.scramble_mutation(child)

                new_population.append(child)
            
            population = new_population

        # Return solusi terbaik
        best_solution = max(population, key=self.calculate_fitness)
        total_distance = self.calculate_total_distance(best_solution)
        total_time = self.calculate_total_time(best_solution)

        return {
            'route': best_solution,
            'totalDistance': round(total_distance, 2),
            'totalTime': round(total_time),
            'fitnessScore': round(self.calculate_fitness(best_solution), 4)
        }

    def are_results_equal(self, result1, result2):
        return (round(result1['fitnessScore'] * 1000000) == round(result2['fitnessScore'] * 1000000) and
                round(result1['totalDistance'] * 100) == round(result2['totalDistance'] * 100) and
                result1['totalTime'] == result2['totalTime'])

    def calculate_all_routes(self, start_location):
        all_results = []
        
        for i, combination in enumerate(self.method_combinations):
            best_run = None
            # Jalankan 3 kali untuk mengurangi variance
            for run in range(3):
                result = self.genetic_algorithm(
                    start_location, 
                    combination['selection'], 
                    combination['mutation']
                )
                if best_run is None or result['fitnessScore'] > best_run['fitnessScore']:
                    best_run = result
            
            combination_result = {
                **best_run,
                'combinationName': combination['name'],
                'selectionMethod': combination['selection'],
                'mutationMethod': combination['mutation'],
                'rank': 0,
                'combinationIndex': i
            }
            
            all_results.append(combination_result)

        # Sort hasil berdasarkan fitness score
        all_results.sort(key=lambda x: (
            -round(x['fitnessScore'] * 1000000),  # Higher fitness is better
            round(x['totalDistance'] * 100),      # Lower distance is better
            x['totalTime'],                       # Lower time is better
            x['combinationIndex']                 # Tie breaker
        ))

        # Assign ranks
        current_rank = 1
        for i in range(len(all_results)):
            if i > 0:
                current = all_results[i]
                previous = all_results[i - 1]
                
                if not self.are_results_equal(current, previous):
                    current_rank = i + 1
            
            all_results[i]['rank'] = current_rank

        # Find best results
        best_results = [result for result in all_results if result['rank'] == 1]
        
        return {
            'allResults': all_results,
            'bestResults': best_results
        }

# Initialize optimizer
optimizer = WisataRouteOptimizer()

@app.route('/api/locations', methods=['GET'])
def get_locations():
    """Get all available locations"""
    return jsonify({
        'success': True,
        'locations': optimizer.locations
    })

@app.route('/api/calculate-routes', methods=['POST'])
def calculate_routes():
    """Calculate optimal routes using all 9 combinations"""
    try:
        data = request.get_json()
        start_location = data.get('startLocation')
        
        if not start_location:
            return jsonify({
                'success': False,
                'message': 'Start location is required'
            }), 400
        
        if start_location not in optimizer.locations:
            return jsonify({
                'success': False,
                'message': 'Invalid start location'
            }), 400
        
        # Calculate routes
        results = optimizer.calculate_all_routes(start_location)
        
        return jsonify({
            'success': True,
            'data': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'An error occurred: {str(e)}'
        }), 500

@app.route('/api/calculate-single-route', methods=['POST'])
def calculate_single_route():
    """Calculate route for a single combination"""
    try:
        data = request.get_json()
        start_location = data.get('startLocation')
        selection_method = data.get('selectionMethod')
        mutation_method = data.get('mutationMethod')
        
        if not all([start_location, selection_method, mutation_method]):
            return jsonify({
                'success': False,
                'message': 'All parameters are required'
            }), 400
        
        result = optimizer.genetic_algorithm(start_location, selection_method, mutation_method)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'An error occurred: {str(e)}'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Wisata Route API is running',
        'timestamp': time.time()
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)